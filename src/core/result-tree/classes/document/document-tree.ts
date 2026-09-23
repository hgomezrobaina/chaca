import { ChacaError, NotExistRefFieldError } from "../../../../errors";
import { NodeRoute } from "../../../input-tree/core/node/value-object/route";
import { FieldNode } from "../node/field-node";
import { SingleResultNode } from "../single-result";

interface GetRefValueByRouteProps {
  caller: NodeRoute;
  search: NodeRoute;
}

export class DocumentTree<D = any> {
  private nodes: FieldNode[] = [];

  insertField(newField: FieldNode) {
    this.nodes.push(newField);
  }

  getDocumentObject(): D {
    const returnObject: Record<string, unknown> = {};

    for (const n of this.nodes) {
      returnObject[n.name] = n.value();
    }

    return returnObject as D;
  }

  getNodeByNodeRoute(fieldTreeRoute: string[]): FieldNode {
    let returnValue = undefined;

    for (let i = 0; i < this.nodes.length && returnValue === undefined; i++) {
      if (this.nodes[i].name === fieldTreeRoute[0]) {
        returnValue = this.nodes[i].getNodeByRoute(fieldTreeRoute.slice(1));
      }
    }

    if (returnValue !== undefined) {
      return returnValue;
    } else {
      throw new ChacaError(
        `The field ${fieldTreeRoute.join(".")} do not exists`,
      );
    }
  }

  getRefValueByNodeRoute({
    caller,
    search,
  }: GetRefValueByRouteProps): SingleResultNode {
    let returnValue = undefined;

    for (let i = 0; i < this.nodes.length && returnValue === undefined; i++) {
      if (this.nodes[i].name === search.array()[0]) {
        returnValue = this.nodes[i].getRefValueByRoute({
          caller: caller,
          search: search.pop(),
          baseSearch: search,
        });
      }
    }

    if (returnValue) {
      return returnValue;
    } else {
      throw new NotExistRefFieldError(caller.string(), search.string());
    }
  }
}
