import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Zap, Loader2 } from 'lucide-react';
import { useServerDistribute } from '@/hooks/useLeadRoutingServer';

export default function QuickDistributeWidget() {
  const [roleFilter, setRoleFilter] = useState<'any' | 'sdr' | 'closer'>('any');
  const distribute = useServerDistribute();

  return (
    <Card className="border border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Distribuição Rápida
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Papel alvo</Label>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Qualquer</SelectItem>
                <SelectItem value="sdr">Somente SDR</SelectItem>
                <SelectItem value="closer">Somente Closer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            onClick={() => distribute.mutate({ roleFilter })}
            disabled={distribute.isPending}
            className="h-9"
          >
            {distribute.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Zap className="h-4 w-4 mr-1" />
            )}
            Distribuir
          </Button>
        </div>
        {distribute.isSuccess && distribute.data && (
          <p className="text-xs text-success mt-2">
            ✓ Distribuído para {distribute.data.member_name}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
