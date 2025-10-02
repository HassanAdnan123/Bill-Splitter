"use client";

import { useEffect } from "react";
import { useBillContext } from "@/context/BillContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { computePerHeadResults } from "@/lib/calculations";

export default function PerHeadResultsPage() {
  const { people, results, setResults, totals } = useBillContext();

  useEffect(() => {
    const r = computePerHeadResults(people, totals.itemsTotal);
    setResults(r);
  }, [people, totals.itemsTotal, setResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <Card className="animate-in fade-in-50 duration-300">
          <CardHeader>
            <CardTitle>Split Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center mb-4">
                <p className="text-lg">
                  {totals.itemsTotal.toFixed(2)} ÷ {people.filter((p) => p.name.trim()).length} = <span className="font-bold">{(totals.itemsTotal / Math.max(1, people.filter((p) => p.name.trim()).length)).toFixed(2)}</span>
                </p>
                <p className="text-sm text-gray-600">per person</p>
              </div>
              <div className="space-y-3">
                {results.map((result, i) => (
                  <div key={i} className="text-center">
                    <p className="text-base leading-relaxed">
                      {result.name} will <span className="font-bold">{result.type}</span> {result.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
                {results.length === 0 && (
                  <p className="text-center text-gray-600 py-4">Everyone paid their fair share! 🎉</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link href="/per-head/items">
                <Button variant="outline" className="w-full text-xs">Edit Items</Button>
              </Link>
              <Link href="/per-head/people">
                <Button variant="outline" className="w-full text-xs">Edit People</Button>
              </Link>
            </div>

            <Link href="/">
              <Button className="w-full">New Split</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


