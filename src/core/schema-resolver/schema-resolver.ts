import {
  ChacaError,
  CyclicAccessDataError,
  SchemaCountFunctionError,
} from "../../errors";
import { ChacaUtils } from "../utils";
import { SchemaInput } from "../schema/interfaces/schema";
import { ChacaInputTree } from "../input-tree/chaca-input-tree";
import { InputTreeNode, RefValueNode, KeyValueNode } from "../input-tree/core";
import { ChacaResultTree } from "../result-tree/chaca-result-tree";
import { SchemaStore } from "../schema-store/schema-store";
import { GetStoreValueConfig } from "../schema-store/interfaces/schema-store";
import { SearchedRefValue } from "../input-tree/core/ref/interfaces/ref";
import { DatatypeModule } from "../../modules/datatype";
import { SubFieldsCreator } from "./core/sub-fields-creator";
import { NodeRoute } from "../input-tree/core/node/value-object/route";
import { SolutionCreator } from "./core/solution-creator";
import { ArrayCreator } from "./core/array-creator";
import { FillSolution } from "./core/fill-solution";
import { SchemaToResolve } from "./value-object/schema-input";
import { DocumentTree } from "../result-tree/classes/document/document-tree";
import { FieldNode } from "../result-tree/classes/node/field-node";
import { SchemaName } from "./value-object/schema-name";
import { SchemaCountExecutor } from "./value-object/schema-count-executor";
import { DatasetStore } from "../dataset-store/dataset-store";
import { SchemaCount } from "./value-object/schema-count";

interface GetRefValueProps {
  caller: NodeRoute;
  search: NodeRoute;
}

interface Props {
  name: string;
  input: SchemaInput;
  countExecutor: SchemaCountExecutor;
  count: SchemaCount;
  schemaIndex: number;
  consoleVerbose: boolean;
}

export class SchemaResolver<K = any> {
  private readonly subFieldsCreator: SubFieldsCreator;
  private readonly solutionCreator: SolutionCreator;
  private readonly arrayCreator: ArrayCreator;
  private readonly fillSolution: FillSolution;

  readonly index: number;
  readonly route: NodeRoute;

  private inputTree: ChacaInputTree | null = null;
  private resultTree: ChacaResultTree<K>;
  private name: string;
  private countDocExecutor: SchemaCountExecutor;
  private count: SchemaCount;
  private input: SchemaToResolve;

  private isBuilding = false;
  private finishBuilding = false;

  private schemasStore: SchemaStore;

  private consoleVerbose = false;

  constructor(
    private readonly utils: ChacaUtils,
    private readonly datatypeModule: DatatypeModule,
    { consoleVerbose, count, countExecutor, schemaIndex, name, input }: Props,
  ) {
    this.index = schemaIndex;
    this.name = new SchemaName(name, this.index).value();
    this.schemasStore = new SchemaStore([]);
    this.route = new NodeRoute([name]);
    this.input = new SchemaToResolve(this.route, input);
    this.consoleVerbose = consoleVerbose;

    this.resultTree = new ChacaResultTree<K>(this.name);
    this.countDocExecutor = countExecutor;
    this.count = count;

    this.fillSolution = new FillSolution();
    this.solutionCreator = new SolutionCreator(
      this.schemasStore,
      this.resultTree,
      this,
    );
    this.arrayCreator = new ArrayCreator(
      this.solutionCreator,
      this.fillSolution,
    );
    this.subFieldsCreator = new SubFieldsCreator(
      this.solutionCreator,
      this.fillSolution,
    );

    // set fill solution dependencies
    this.fillSolution.arrayCreator = this.arrayCreator;
    this.fillSolution.subFieldsCreator = this.subFieldsCreator;
  }

  async resolve(): Promise<K[]> {
    this.buildInputTree();

    await this.buildTrees(this.route);

    return this.getDocumentsArray();
  }

  getKeyNodes(): KeyValueNode[] {
    let keys = [] as KeyValueNode[];

    if (this.inputTree) {
      keys = this.inputTree.getKeyFields();
    }

    return keys;
  }

  getPossibleNullNodes(): InputTreeNode[] {
    let nodes = [] as InputTreeNode[];

    if (this.inputTree) {
      nodes = this.inputTree.getPossibleNullNodes();
    }

    return nodes;
  }

  getRefNodes(): RefValueNode[] {
    if (this.inputTree) {
      return this.inputTree.getRefNodes();
    } else {
      return [];
    }
  }

  getSchemaToResolve() {
    return this.input;
  }

  buildInputTree(): void {
    if (this.inputTree === null) {
      this.inputTree = new ChacaInputTree(this.utils, this.datatypeModule, {
        name: this.name,
        schemaToResolve: this.input,
        schemasStore: this.schemasStore,
        count: this.count,
      });
    }
  }

  getSchemaName(): string {
    return this.name;
  }

  isFinishBuilding() {
    return this.finishBuilding;
  }

  isBuildingTrees(): boolean {
    return this.isBuilding;
  }

  setInjectedSchemas(array: SchemaResolver[]): void {
    this.schemasStore.setInjectedSchemas(array);
  }

  getInputTree() {
    return this.inputTree;
  }

  getResultTree() {
    return this.resultTree;
  }

  async getAllValuesByRoute(
    fieldToGet: string[],
    config: GetStoreValueConfig,
  ): Promise<Array<DocumentTree<K> | FieldNode>> {
    if (fieldToGet.length === 0) {
      const whereFunction = config.where;

      if (whereFunction) {
        const filterDocuments = [];

        for (const d of this.resultTree.getDocuments()) {
          const condition =
            d !== config.omitDocument &&
            (await whereFunction(d.getDocumentObject()));

          if (condition) {
            filterDocuments.push(d);
          }
        }

        return filterDocuments;
      } else {
        return this.resultTree.getDocuments();
      }
    } else {
      const allNodes = await this.resultTree.getAllValuesByNodeRoute(
        fieldToGet,
        config,
      );

      return allNodes;
    }
  }

  getAllRefValuesByNodeRoute({
    caller,
    search,
  }: GetRefValueProps): SearchedRefValue[] {
    return this.resultTree.getAllRefValuesByNodeRoute({
      caller: caller,
      search: search,
    });
  }

  searchRefNodes() {
    if (this.inputTree) {
      this.inputTree.searchRefNodes();
    }
  }

  dangerCyclic(): boolean {
    if (!this.finishBuilding && this.isBuilding) {
      return true;
    } else {
      return false;
    }
  }

  async buildTrees(caller: NodeRoute): Promise<void> {
    if (!this.finishBuilding) {
      if (!this.isBuilding) {
        if (this.inputTree) {
          if (this.consoleVerbose) {
            // eslint-disable-next-line no-console
            console.log(`Creating ${this.name} data...`);
          }

          // indicar que se está construyendo los datos
          this.isBuilding = true;

          // calculate count
          let count: number;
          const save = this.count.value();

          if (save === null) {
            try {
              count = await this.countDocExecutor.value({
                store: new DatasetStore({
                  caller: this.route,
                  omitResolver: this,
                  schemasStore: this.schemasStore,
                }),
              });
            } catch (error) {
              if (error instanceof ChacaError) {
                throw error;
              }

              throw new SchemaCountFunctionError({
                schemaName: this.name,
                error: error,
              });
            }

            this.count.setValue(count);
          } else {
            count = save;
          }

          for (let indexDoc = 0; indexDoc < count; indexDoc++) {
            const newDoc = new DocumentTree<K>();

            // insertar el nuevo documento
            this.resultTree.insertDocument(newDoc);

            // recorrer los fields del dataset actual para crear cada uno en el documento que le pertenece
            for (const datField of this.inputTree.getFields()) {
              const solution = await this.solutionCreator.execute({
                field: datField,
                indexDoc: indexDoc,
              });

              // insertar la solucion del field en el documento
              newDoc.insertField(solution);

              await this.fillSolution.execute({
                solution: solution,
                input: datField,
                indexDoc: indexDoc,
              });
            }
          }

          // indicar que se acabo de construir
          this.isBuilding = false;

          // indicar que ha acabado de crear los result trees
          this.finishBuilding = true;
        } else {
          throw new ChacaError(
            `It's imposible create the result trees for the schema ${this.name}, because the input tree was not created yet.`,
          );
        }
      } else {
        throw new CyclicAccessDataError(
          `From ${caller.string()}, you are trying to access ${
            this.name
          } when this one is being created`,
        );
      }
    }
  }

  getDocumentsArray(omitDocument?: DocumentTree<K>): K[] {
    const result: K[] = [];

    for (const d of this.getResultTree().getDocuments()) {
      if (d !== omitDocument) {
        result.push(d.getDocumentObject());
      }
    }

    return result;
  }
}
