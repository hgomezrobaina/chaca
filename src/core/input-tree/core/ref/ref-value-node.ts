import {
  ChacaError,
  CyclicAccessDataError,
  NotEnoughValuesForRefError,
  NotExistRefFieldError,
  RefWhereFunctionError,
  TryRefANoKeyFieldError,
} from "../../../../errors";
import { GenerateProps, InputTreeNode } from "../node/input-tree-node";
import { ChacaUtils } from "../../../utils";
import { FieldToRefObject } from "../../../fields/core/ref/ref-field";
import { SchemaStore } from "../../../schema-store/schema-store";
import { DatasetStore } from "../../../dataset-store/dataset-store";
import { SearchedRefValue } from "./interfaces/ref";
import { RefRoute } from "./value-object/route";
import { IsArray, NotArray } from "../is-array/is-array";
import { SchemaResolver } from "../../../schema-resolver/schema-resolver";
import { NodeRoute } from "../node/value-object/route";
import { NotNull, PossibleNull } from "../possible-null/possible-null";
import { DocumentTree } from "../../../result-tree/classes/document/document-tree";
import { SingleResultNode } from "../../../result-tree/classes/single-result";
import { FieldNode } from "../../../result-tree/classes/node/field-node";

export class RefValueNode extends InputTreeNode {
  private refFieldTreeRoute: RefRoute;
  private schemaRefIndex: number | null = null;
  private allRefNodes: SearchedRefValue[] | null = null;
  private allAcceptedNodes: SingleResultNode[] | null = null;
  private readonly refFieldsCache = new WeakMap<DocumentTree, unknown>();
  private noMoreValues = false;

  constructor(
    private readonly utils: ChacaUtils,
    route: NodeRoute,
    isArray: IsArray,
    possibleNull: PossibleNull,
    readonly refField: FieldToRefObject,
    readonly schemasStore: SchemaStore,
  ) {
    super(route, isArray, possibleNull);

    this.refFieldTreeRoute = new RefRoute({
      ref: this.refField.refField,
      route: route,
    });
  }

  nullWhenEmpty() {
    return this.refField.nullOnEmpty;
  }

  isUnique() {
    return this.refField.unique;
  }

  getRefFieldRoute(): NodeRoute {
    return this.refFieldTreeRoute.value();
  }

  searchSchemaRef(): void {
    let exists = -1;

    const schemas = this.schemasStore.getSchemasResolvers();
    for (let i = 0; i < schemas.length && exists === -1; i++) {
      const inputTree = schemas[i].getInputTree();

      if (inputTree) {
        const found = inputTree.checkIfFieldExists(
          this.refFieldTreeRoute.value().array(),
        );

        if (found) {
          exists = i;
        }
      }
    }

    if (exists === -1) {
      throw new NotExistRefFieldError(
        this.getRouteString(),
        this.refField.refField,
      );
    } else {
      this.schemaRefIndex = exists;
    }
  }

  getSchemaRef(): SchemaResolver | null {
    if (this.schemaRefIndex === null) {
      return null;
    } else {
      return this.schemasStore.get(this.schemaRefIndex);
    }
  }

  /**
   * Cuando no quedan valores para referenciar, todas las iteraciones restantes
   * de un array darían el mismo resultado vacío, por lo que se corta el llenado.
   */
  stopArrayFill(): boolean {
    return this.noMoreValues;
  }

  checkIfFieldExists(fieldTreeRoute: string[]): boolean {
    if (fieldTreeRoute.length === 0) {
      throw new TryRefANoKeyFieldError(this.getRouteString());
    } else {
      return false;
    }
  }

  private async filterRefNodesByConfig(
    schemaRef: SchemaResolver,
    currentDocument: DocumentTree,
    currentSchemaResolverIndex: number,
    refItSelf: boolean,
  ): Promise<SingleResultNode[]> {
    const allRefValues = this.allRefNodes
      ? this.allRefNodes
      : schemaRef.getAllRefValuesByNodeRoute({
          search: this.refFieldTreeRoute.value(),
          caller: this.route,
        });

    if (!this.allRefNodes && !refItSelf) {
      this.allRefNodes = allRefValues;
    }

    const where = this.refField.where;

    if (!where) {
      return this.acceptedWithoutWhere(
        allRefValues,
        currentDocument,
        refItSelf,
      );
    }

    const caller = this.getFieldRoute();
    const currentSchemaResolver = this.schemasStore.get(
      currentSchemaResolverIndex,
    );

    // invariante del bucle: el documento que referencia no cambia mientras se
    // recorren sus candidatos
    const currentFields = currentDocument.getDocumentObject();

    const returnRefValues: SingleResultNode[] = [];

    for (const refNode of allRefValues) {
      if (currentDocument === refNode.document) {
        continue;
      }

      const refDocument = refNode.document;

      let isAccepted: boolean;

      try {
        isAccepted = await where({
          refFields: this.refFieldsOf(refDocument, refItSelf),
          currentFields: currentFields,
          store: new DatasetStore({
            schemasStore: this.schemasStore,
            omitCurrentDocument: refDocument,
            omitResolver: currentSchemaResolver,
            caller: caller,
          }),
        });
      } catch (error) {
        if (error instanceof ChacaError) {
          throw error;
        }

        throw new RefWhereFunctionError(this.getRefFieldRoute().string(), {
          route: this.getRouteString(),
          error: error,
        });
      }

      if (isAccepted) {
        returnRefValues.push(refNode.resultNode);
      }
    }

    return returnRefValues;
  }

  /**
   * Sin `where` el único criterio es que el candidato no sea el propio
   * documento, y eso sólo puede pasar cuando el schema se referencia a sí
   * mismo. Referenciando otro schema la lista es siempre la misma, así que se
   * construye una vez en vez de por documento.
   */
  private acceptedWithoutWhere(
    allRefValues: SearchedRefValue[],
    currentDocument: DocumentTree,
    refItSelf: boolean,
  ): SingleResultNode[] {
    if (refItSelf) {
      const nodes: SingleResultNode[] = [];

      for (const refNode of allRefValues) {
        if (currentDocument !== refNode.document) {
          nodes.push(refNode.resultNode);
        }
      }

      return nodes;
    }

    if (!this.allAcceptedNodes) {
      this.allAcceptedNodes = allRefValues.map((n) => n.resultNode);
    }

    return this.allAcceptedNodes;
  }

  /**
   * El schema referenciado termina de construirse antes de recorrer sus
   * candidatos, así que sus documentos ya no cambian y su objeto se reutiliza
   * entre todos los documentos que lo referencian. En un ref a sí mismo todavía
   * se están añadiendo documentos, así que ahí se reconstruye.
   */
  private refFieldsOf(document: DocumentTree, refItSelf: boolean): unknown {
    if (refItSelf) {
      return document.getDocumentObject();
    }

    let fields = this.refFieldsCache.get(document);

    if (!fields) {
      fields = document.getDocumentObject();
      this.refFieldsCache.set(document, fields);
    }

    return fields;
  }

  private async value(
    currentDocument: DocumentTree,
    icurrentSchemaResolver: number,
  ): Promise<unknown | unknown[]> {
    const schemaRef = this.getSchemaRef();

    const currentResolver = this.schemasStore.get(icurrentSchemaResolver);

    if (schemaRef) {
      const refItSelf = icurrentSchemaResolver === schemaRef.index;

      if (!schemaRef.dangerCyclic() || refItSelf) {
        if (!refItSelf) {
          // build schema ref trees
          await schemaRef.buildTrees(currentResolver.route);
        }

        // get all fields nodes to ref
        const allValues = await this.filterRefNodesByConfig(
          schemaRef,
          currentDocument,
          icurrentSchemaResolver,
          refItSelf,
        );

        if (this.isUnique()) {
          const noTakenValues = allValues.filter(
            (n) => !n.isTaken(this.getFieldRoute()),
          );

          if (
            noTakenValues.length === 0 &&
            !refItSelf &&
            !this.nullWhenEmpty()
          ) {
            throw new NotEnoughValuesForRefError(
              this.getRouteString(),
              this.getRefFieldRoute().string(),
            );
          }

          const node = this.utils.oneOfArray(noTakenValues);

          if (node) {
            node.changeIsTaken(this.getFieldRoute());
          } else {
            this.noMoreValues = true;
          }

          if (refItSelf || this.nullWhenEmpty()) {
            return node ? node.value() : null;
          }

          return node.value();
        } else {
          if (allValues.length === 0 && !refItSelf && !this.nullWhenEmpty()) {
            throw new NotEnoughValuesForRefError(
              this.getRouteString(),
              this.getRefFieldRoute().string(),
            );
          }

          const node = this.utils.oneOfArray(allValues);

          if (!node) {
            this.noMoreValues = true;
          }

          if (refItSelf || this.nullWhenEmpty()) {
            return node ? node.value() : null;
          }

          return node.value();
        }
      } else {
        throw new CyclicAccessDataError(
          `The field ${this.getRouteString()} is trying to access ${this.getRefFieldRoute().string()}, and it uses that field to create itself`,
        );
      }
    } else {
      throw new ChacaError(
        `First find the schema resolver for the ref field '${this.getRouteString()}'`,
      );
    }
  }

  async generate({
    schemaIndex,
    currentDocument,
  }: GenerateProps): Promise<FieldNode> {
    const refValue = await this.value(currentDocument, schemaIndex);

    const result = new SingleResultNode({
      name: this.getName(),
      value: refValue,
    });

    return result;
  }

  setSchemaRef(resolverIndex: number): void {
    this.schemaRefIndex = resolverIndex;
  }

  /**
   * Los elementos de un array no son campos, por lo que no llevan la
   * configuracion de nulos del campo: `possibleNull` decide si el valor del
   * campo es un array o `null`, no si cada elemento lo es.
   */
  getNoArrayNode(): InputTreeNode {
    const newRefNode = new RefValueNode(
      this.utils,
      this.route,
      new NotArray(),
      new NotNull(),
      this.refField,
      this.schemasStore,
    );

    if (this.schemaRefIndex !== null) {
      newRefNode.setSchemaRef(this.schemaRefIndex);
    }

    return newRefNode;
  }
}
