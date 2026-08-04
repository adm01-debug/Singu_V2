import { useMemo } from "react";
import { Building2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AccountTierBadge } from "./AccountTierBadge";
import type { ABMAccount } from "@/hooks/useABM";

interface TreeNode extends ABMAccount {
  children: TreeNode[];
}

function buildTree(accounts: ABMAccount[], rootId: string | null = null): TreeNode[] {
  return accounts
    .filter((a) => a.parent_account_id === rootId)
    .map((a) => ({ ...a, children: buildTree(accounts, a.id) }));
}

function NodeRow({ node, depth, currentId }: { node: TreeNode; depth: number; currentId?: string }) {
  return (
    <div>
      <Link
        to={`/abm/${node.id}`}
        className={cn(
          "flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition",
          currentId === node.id && "bg-primary/10"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {depth > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
        <Building2 className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium truncate flex-1">{node.company_name}</span>
        <AccountTierBadge tier={node.tier} />
        <span className="text-xs font-semibold text-muted-foreground">{node.account_score}</span>
      </Link>
      {node.children.map((child) => (
        <NodeRow key={child.id} node={child} depth={depth + 1} currentId={currentId} />
      ))}
    </div>
  );
}

export function AccountHierarchyTree({ accounts, currentId }: { accounts: ABMAccount[]; currentId?: string }) {
  const tree = useMemo(() => buildTree(accounts, null), [accounts]);
  if (tree.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma hierarquia definida</p>;
  }
  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <NodeRow key={node.id} node={node} depth={0} currentId={currentId} />
      ))}
    </div>
  );
}
