"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Counter = {
  name: string;
  color: string;
  accrues: boolean;
  remaining: number;
  taken: number;
};

const DEFAULT_VISIBLE = 3;

export function CountersGrid({ counters }: { counters: Counter[] }) {
  const [expanded, setExpanded] = useState(false);

  const hasMore = counters.length > DEFAULT_VISIBLE;
  const visible = expanded ? counters : counters.slice(0, DEFAULT_VISIBLE);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => (
          <Card key={c.name}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {c.accrues ? (
                <>
                  <div className="text-2xl font-bold text-primary">
                    {c.remaining}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      j restants
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.taken} pris</p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary">
                    {c.taken}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      j pris
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">cette année</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-4" />
              Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="size-4" />
              Voir {counters.length - DEFAULT_VISIBLE} de plus
            </>
          )}
        </Button>
      )}
    </div>
  );
}
