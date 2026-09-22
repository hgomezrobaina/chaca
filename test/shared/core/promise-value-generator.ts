export class PromiseGeneratorValue {
  /**
   * Valor que llega en un macrotask posterior, para los tests que comprueban
   * que la librería espera de verdad a una función asíncrona.
   *
   * Lo que hace útil al helper es que el valor **no** esté disponible de forma
   * síncrona: si la librería dejara de hacer `await`, el campo recibiría la
   * `Promise` en vez del valor y la aserción fallaría igual. Esperar más no
   * añade sensibilidad, sólo tiempo — y como `possibleNull` o `isArray` se
   * evalúan una vez por documento, se multiplica por cada uno: con los 100 ms
   * que había antes, un solo test de 100 documentos tardaba 11 segundos.
   *
   * Por defecto usa `setImmediate` y no `setTimeout`. Es igual de macrotask,
   * pero se salta el reloj del sistema: en Windows la granularidad es de unos
   * 15.6 ms, así que ni siquiera un `setTimeout(..., 1)` baja de ahí y esos
   * mismos 100 documentos seguían costando segundo y medio.
   *
   * @param delay milisegundos, para el test que necesite de verdad esperar
   */
  static execute<T>(value: T, delay?: number): Promise<T> {
    return new Promise((resolve) => {
      if (typeof delay === "number") {
        return setTimeout(() => resolve(value), delay);
      }

      return setImmediate(() => resolve(value));
    });
  }
}
