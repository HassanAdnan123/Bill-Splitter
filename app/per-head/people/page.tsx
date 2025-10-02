"use client";

import { useMemo } from "react";
import { useBillContext } from "@/context/BillContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { validateTotals } from "@/lib/calculations";

export default function PerHeadPeoplePage() {
  const { people, setPeople, totals } = useBillContext();

  const addPerson = () => setPeople([...people, { id: Date.now().toString(), name: "", contribution: 0 }]);
  const updatePerson = (id: string, field: "name" | "contribution", value: string | number) => {
    setPeople(people.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };
  const removePerson = (id: string) => {
    if (people.length > 1) setPeople(people.filter((p) => p.id !== id));
  };

  const validation = useMemo(
    () => validateTotals(totals.itemsTotal, totals.contributionsTotal, "per-head"),
    [totals.itemsTotal, totals.contributionsTotal]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <Card className="animate-in fade-in-50 duration-300">
          <CardHeader>
            <CardTitle>Add People & Contributions</CardTitle>
            <p className="text-sm text-gray-600">Total to split: {totals.itemsTotal.toFixed(2)}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {people.map((person) => (
              <div key={person.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor={`person-name-${person.id}`}>Name</Label>
                  <Input
                    id={`person-name-${person.id}`}
                    placeholder="e.g., John"
                    value={person.name}
                    onChange={(e) => updatePerson(person.id, "name", e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <Label htmlFor={`person-contribution-${person.id}`}>Paid</Label>
                  <Input
                    id={`person-contribution-${person.id}`}
                    type="number"
                    placeholder="0"
                    value={person.contribution || ""}
                    onChange={(e) => updatePerson(person.id, "contribution", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
                {people.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => removePerson(person.id)} className="mb-0">
                    ×
                  </Button>
                )}
              </div>
            ))}

            <Button variant="outline" onClick={addPerson} className="w-full bg-transparent">
              <Plus className="w-4 h-4 mr-2" />
              Add Person
            </Button>

            <Alert className={validation.isValid ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
              <AlertCircle className={`h-4 w-4 ${validation.isValid ? "text-green-600" : "text-orange-600"}`} />
              <AlertDescription className={validation.isValid ? "text-green-700" : "text-orange-700"}>
                <div className="flex justify-between items-center">
                  <span>Contributions: {totals.contributionsTotal.toFixed(2)}</span>
                  <span className="text-sm">{validation.message}</span>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Link href="/per-head/items" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Link href="/per-head/results" className="flex-1">
                <Button className="w-full" disabled={!people.some((p) => p.name.trim()) || !validation.isValid}>
                  Calculate
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


