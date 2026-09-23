import { ChacaError, NotExistRefFieldError } from "../../../../errors";
import { FieldNode, GetRefValueProps } from "../node/field-node";
import { SingleResultNode } from "../single-result";

export class MixedFieldNode extends FieldNode {
  nodes: FieldNode[] = [];

  insertNode(node: FieldNode): void {
    this.nodes.push(node);
  }

  value(): unknown {
    const resultObject: Record<string, unknown> = {};

    for (const n of this.nodes) {
      resultObject[n.name] = n.value();
    }

    return resultObject;
  }

  getNodeByRoute(fieldTreeRoute: string[]): FieldNode {
    let returnNode = undefined;

    for (let i = 0; i < this.nodes.length && returnNode === undefined; i++) {
      if (this.nodes[i].name === fieldTreeRoute[0]) {
        returnNode = this.nodes[i].getNodeByRoute(fieldTreeRoute.slice(1));
      }
    }

    if (returnNode) {
      return returnNode;
    } else {
      throw new ChacaError(
        `The field ${fieldTreeRoute.join(".")} do not exists`,
      );
    }
  }

  getRefValueByNodeRoute({
    search,
    caller,
    baseSearch,
  }: GetRefValueProps): SingleResultNode {
    let returnNode = undefined;

    for (let i = 0; i < this.nodes.length && returnNode === undefined; i++) {
      if (this.nodes[i].name === search.array()[0]) {
        returnNode = this.nodes[i].getRefValueByRoute({
          search: search.pop(),
          caller: caller,
          baseSearch: baseSearch,
        });
      }
    }

    if (returnNode) {
      return returnNode;
    } else {
      throw new NotExistRefFieldError(caller.string(), baseSearch.string());
    }
  }
}
