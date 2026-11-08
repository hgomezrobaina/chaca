interface Props<T extends { id: unknown }> {
  /** Documents of the referenced entity */
  documents: T[];
  /** Id value held by the referencing field */
  id: T["id"];
  /** Dotted path of the referencing field, e.g. "Payment.order_id" */
  from: string;
}

/**
 * Resolves a `chaca.ref` to its referenced document. A `ref` guarantees the
 * referenced row exists, so a `.find()` without a guard, or a random
 * fallback when it is not found, either crashes with a confusing error or
 * hides a real generation bug. This throws a message that names the
 * referencing field and the id it could not resolve.
 */
export class FindRef {
  static execute<T extends { id: unknown }>({
    documents,
    id,
    from,
  }: Props<T>): T {
    const found = documents.find((document) => {
      return document.id === id;
    });

    if (found === undefined) {
      throw new Error(`${from} references a missing id: ${String(id)}`);
    }

    return found;
  }
}
