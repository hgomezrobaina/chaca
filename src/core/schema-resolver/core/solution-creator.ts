import { SchemaResolver } from "../schema-resolver";
import { DatasetStore } from "../../dataset-store/dataset-store";
import { InputTreeNode } from "../../input-tree/core";
import { ChacaResultTree } from "../../result-tree/chaca-result-tree";
import { SchemaStore } from "../../schema-store/schema-store";
import { FieldNode } from "../../result-tree/classes/node/field-node";
import { ArrayResultNode } from "../../result-tree/classes/array";
import { SingleResultNode } from "../../result-tree/classes/single-result";
import {
  ChacaError,
  FieldGenerationError,
  FieldGenerationErrorProps,
  IsArrayFunctionError,
  PossibleNullFunctionError,
  ValueGenerationError,
} from "../../../errors";

interface Props {
  field: InputTreeNode;
  indexDoc: number;
}

type FieldGenerationErrorClass = new (
  props: FieldGenerationErrorProps,
) => FieldGenerationError;

export class SolutionCreator {
  constructor(
    private readonly schemasStore: SchemaStore,
    private resultTree: ChacaResultTree,
    private readonly resolver: SchemaResolver,
  ) {}

  /**
   * Ejecuta una fase de la resolución de un campo y, si algo ajeno a chaca
   * falla dentro de ella, lo envuelve indicando en qué campo, documento y
   * función ocurrió. Los errores propios de chaca (`instanceof ChacaError`)
   * se dejan pasar intactos: ya traen su propio contexto y su propio tipo, y
   * envolverlos de nuevo los haría irreconocibles con `instanceof` además de
   * ocultar, por ejemplo, el campo más profundo que realmente falló cuando
   * una función accede a otro campo a través del `store`.
   */
  private async run<T>(
    field: InputTreeNode,
    indexDoc: number,
    ErrorClass: FieldGenerationErrorClass,
    execute: () => Promise<T>,
  ): Promise<T> {
    try {
      return await execute();
    } catch (error) {
      if (error instanceof ChacaError) {
        throw error;
      }

      throw new ErrorClass({
        route: field.getRouteString(),
        index: indexDoc,
        error: error,
      });
    }
  }

  async execute({ field, indexDoc }: Props): Promise<FieldNode> {
    const currentDocument = this.resultTree.getDocumentByIndex(indexDoc);

    const store = new DatasetStore({
      schemasStore: this.schemasStore,
      omitCurrentDocument: currentDocument,
      omitResolver: this.resolver,
      caller: field.getFieldRoute(),
    });

    const isNull = await this.run(
      field,
      indexDoc,
      PossibleNullFunctionError,
      () =>
        field.isNull({
          store: store,
          currentDocument: currentDocument,
          index: indexDoc,
        }),
    );

    if (isNull) {
      return new SingleResultNode({
        value: null,
        name: field.getName(),
      });
    }

    const limit = await this.run(field, indexDoc, IsArrayFunctionError, () =>
      field.getIsArray().execute({
        currentDocument: currentDocument,
        store: store,
      }),
    );

    // en caso de ser un array
    if (limit !== undefined) {
      return new ArrayResultNode({
        name: field.getName(),
        limit: limit,
      });
    }

    // ifs not an array
    return this.run(field, indexDoc, ValueGenerationError, () =>
      field.generate({
        currentDocument: currentDocument,
        indexDoc: indexDoc,
        schemaIndex: this.resolver.index,
        store: store,
      }),
    );
  }
}
