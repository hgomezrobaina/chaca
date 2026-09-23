import { ChacaError } from "../../errors";
import { DatatypeModule } from "../../modules/datatype";
import { InputTreeNode, KeyValueNode, RefValueNode } from "../input-tree/core";
import { SchemaResolver } from "../schema-resolver/schema-resolver";
import { SchemaCount } from "../schema-resolver/value-object/schema-count";
import { SchemaCountExecutor } from "../schema-resolver/value-object/schema-count-executor";
import { ChacaUtils } from "../utils";
import { DatasetSchema } from "./interfaces/dataset-schema";

interface Props {
  schemas: DatasetSchema[];
  verbose: boolean;
}

export class DatasetResolver<K = any> {
  private resolvers: SchemaResolver[] = [];
  private readonly verbose: boolean;

  constructor(
    private readonly utils: ChacaUtils,
    private readonly datatypeModule: DatatypeModule,
    { schemas, verbose }: Props,
  ) {
    this.verbose = verbose;
    this.createSchemaResolvers(schemas);
    this.validateNotRepeatSchemaNames(schemas);
    this.injectSchemas();
    this.buildInputTrees();
    this.buildRefFields();
  }

  getResolvers() {
    return this.resolvers;
  }

  private validateNotRepeatSchemaNames(schemas: DatasetSchema[]): void {
    for (let i = 0; i < schemas.length; i++) {
      const notRepeat = schemas.filter(
        (s) => s.name.trim() === schemas[i].name.trim(),
      );

      if (notRepeat.length > 1) {
        throw new ChacaError(
          `The name '${schemas[i].name}' is repeat. Your schemas must have different names`,
        );
      }
    }
  }

  private buildRefFields() {
    this.resolvers.forEach((r) => r.searchRefNodes());
  }

  private createSchemaResolvers(schemas: DatasetSchema[]): void {
    this.resolvers = schemas.map((schema, schemaIndex) => {
      if (typeof schema === "object" && schema !== null) {
        return new SchemaResolver(this.utils, this.datatypeModule, {
          name: schema.name,
          input: schema.schema.input,
          countExecutor: SchemaCountExecutor.create({
            value: schema.documents,
            name: schema.name,
            singleSchema: false,
          }),
          count: new SchemaCount({ name: schema.name, singleSchema: false }),
          schemaIndex: schemaIndex,
          consoleVerbose: this.verbose,
        });
      } else {
        const message = `You must provide a object with the schema configuration. Example: { name: 'User', schema: UserSchema, documents: 50 }`;

        throw new ChacaError(message);
      }
    });
  }

  private injectSchemas(): void {
    // inyectar los schema resolvers restantes a cada schema resolver
    for (const resolver of this.resolvers) {
      resolver.setInjectedSchemas(this.resolvers);
    }
  }

  private buildInputTrees(): void {
    this.resolvers.forEach((r) => r.buildInputTree());
  }

  async resolve(): Promise<K> {
    const data: Record<string, unknown> = {};

    for (const r of this.resolvers) {
      data[r.getSchemaName()] = await r.resolve();
    }

    return data as K;
  }

  getRefsNodes() {
    const nodes = [] as RefValueNode[];

    this.resolvers.forEach((r) => {
      nodes.push(...r.getRefNodes());
    });

    return nodes;
  }

  getPossibleNullNodes() {
    const nodes = [] as InputTreeNode[];

    this.resolvers.forEach((r) => {
      nodes.push(...r.getPossibleNullNodes());
    });

    return nodes;
  }

  getKeyNodes() {
    const nodes = [] as KeyValueNode[];

    this.resolvers.forEach((r) => {
      nodes.push(...r.getKeyNodes());
    });

    return nodes;
  }
}
