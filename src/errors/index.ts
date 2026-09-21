export class ChacaError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ChacaError";
  }
}

export class WrongArrayDefinitionError extends ChacaError {
  constructor(
    readonly fieldRoute: string,
    message: string,
  ) {
    super(`On '${fieldRoute}'. ${message}`);

    this.name = "ChacaError.WrongArrayDefinitionError";
  }
}

export class WrongPossibleNullDefinitionError extends ChacaError {
  constructor(
    readonly fieldRoute: string,
    message: string,
  ) {
    super(`On '${fieldRoute}'. ${message}`);

    this.name = `ChacaError.WrongPossibleNullDefinitionError`;
  }
}

export class EmptySequentialValuesError extends ChacaError {
  constructor(readonly fieldRoute: string) {
    super(`There are no more sequential values for the field '${fieldRoute}'`);

    this.name = "ChacaError.EmptySequentialValuesError";
  }
}

export class WrongProbabilityFieldDefinitionError extends ChacaError {
  constructor(
    readonly fieldRoute: string,
    message: string,
  ) {
    super(`On '${fieldRoute}'. ${message}`);

    this.name = "ChacaError.WrongProbabilityFieldDefinitionError";
  }
}

export class PickFieldDefinitionError extends ChacaError {
  constructor(
    readonly fieldRoute: string,
    message: string,
  ) {
    super(`On field '${fieldRoute}'. ${message}`);

    this.name = "ChacaError.PickFieldDefinitionError";
  }
}

export class TryRefANoKeyFieldError extends ChacaError {
  constructor(readonly fieldRoute: string) {
    super(
      `The field '${fieldRoute}' is not a key field, so you can't reference this one`,
    );

    this.name = "ChacaError.TryRefANoKeyFieldError";
  }
}

export class NotEnoughValuesForRefError extends ChacaError {
  constructor(
    readonly refFieldRoute: string,
    readonly keyFieldRoute: string,
  ) {
    super(
      `Not enough values of '${keyFieldRoute}' for the ref field '${refFieldRoute}'`,
    );

    this.name = "ChacaError.NotEnoughValuesForRefError";
  }
}

export class CyclicAccessDataError extends ChacaError {
  constructor(message: string) {
    super(message);
    this.name = "ChacaError.CyclicAccessDataError";
  }
}

export class NotExistRefFieldError extends ChacaError {
  constructor(
    readonly fieldRoute: string,
    readonly refFieldRoute: string,
  ) {
    super(`From '${fieldRoute}', The field '${refFieldRoute}' does not exists`);
    this.name = "ChacaError.NotExistRefFieldError";
  }
}

export class EmptyEnumValuesError extends ChacaError {
  constructor(readonly fieldRoute: string) {
    super(`There are no values for the enum field '${fieldRoute}'`);
    this.name = "ChacaError.EmptyEnumValuesError";
  }
}

/**
 * Turns whatever a thrown value carries into a readable reason. Nothing
 * forces the user's function to `throw new Error(...)`: it can throw a
 * string, an object, or reject with `undefined`.
 */
function reasonOf(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  } else if (typeof error === "string" && error) {
    return error;
  } else {
    return `The function threw a non-error value: ${String(error)}`;
  }
}

export interface FieldGenerationErrorProps {
  /** Ruta completa del campo, incluido el nombre del schema. */
  route: string;
  /** Índice del documento que se estaba generando, cuando se conoce. */
  index?: number;
  /** Lo que lanzó o rechazó la función del usuario, sin normalizar. */
  error: unknown;
}

/**
 * Un campo de la definición del schema depende de una función del usuario
 * (`custom`, `isArray`, `possibleNull`, el `where` de un `ref`, etc.) y esa
 * función lanzó un error. Envuelve el error original (accesible en
 * `originalError` y en `cause`) indicando en qué campo, documento y función
 * ocurrió, en vez de dejar que la excepción original se propague sin
 * contexto.
 *
 * Nunca envuelve un `ChacaError`: si la función falló porque, por ejemplo,
 * intentó leer un campo inexistente a través del `store`, ese error ya trae
 * su propio contexto y su propio tipo, y hay que dejarlo pasar intacto.
 */
export abstract class FieldGenerationError extends ChacaError {
  readonly fieldRoute: string;
  readonly index: number | null;
  readonly originalError: unknown;

  constructor(
    origin: string,
    { route, index, error }: FieldGenerationErrorProps,
  ) {
    const document = typeof index === "number" ? ` (document ${index})` : "";

    super(`On field '${route}'${document}, ${origin}. ${reasonOf(error)}`, {
      cause: error,
    });

    this.name = "ChacaError.FieldGenerationError";
    this.fieldRoute = route;
    this.index = typeof index === "number" ? index : null;
    this.originalError = error;
  }
}

export class PossibleNullFunctionError extends FieldGenerationError {
  constructor(props: FieldGenerationErrorProps) {
    super(`in the 'possibleNull' function`, props);
    this.name = "ChacaError.PossibleNullFunctionError";
  }
}

export class IsArrayFunctionError extends FieldGenerationError {
  constructor(props: FieldGenerationErrorProps) {
    super(`in the 'isArray' function`, props);
    this.name = "ChacaError.IsArrayFunctionError";
  }
}

export class ValueGenerationError extends FieldGenerationError {
  constructor(props: FieldGenerationErrorProps) {
    super(`while generating its value`, props);
    this.name = "ChacaError.ValueGenerationError";
  }
}

export class RefWhereFunctionError extends FieldGenerationError {
  constructor(
    readonly refRoute: string,
    props: FieldGenerationErrorProps,
  ) {
    super(`in the 'where' function of the ref to '${refRoute}'`, props);
    this.name = "ChacaError.RefWhereFunctionError";
  }
}

export interface SchemaCountFunctionErrorProps {
  /** Nombre del schema cuyo `documentsCount` es una función. */
  schemaName: string;
  error: unknown;
}

/**
 * La función que calcula cuántos documentos generar para un schema
 * (`documents`) lanzó un error. A diferencia de `FieldGenerationError`, no
 * está atada a un campo ni a un documento: se ejecuta una única vez, antes de
 * generar el primer documento del schema.
 */
export class SchemaCountFunctionError extends ChacaError {
  readonly schemaName: string;
  readonly originalError: unknown;

  constructor({ schemaName, error }: SchemaCountFunctionErrorProps) {
    super(
      `On schema '${schemaName}', in the 'documents' function. ${reasonOf(error)}`,
      { cause: error },
    );

    this.name = "ChacaError.SchemaCountFunctionError";
    this.schemaName = schemaName;
    this.originalError = error;
  }
}
