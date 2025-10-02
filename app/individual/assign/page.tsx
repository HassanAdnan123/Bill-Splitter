"use client";

import { useMemo, useState } from "react";
import { useBillContext } from "@/context/BillContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AssignItemsPage() {
  const { items, setItems, people, bills } = useBillContext();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  const validPeople = useMemo(() => people.filter((p) => p.name.trim()), [people]);

  const toggleDropdown = (itemId: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const updateItemIncludedPeople = (itemId: string, personId: string, checked: boolean) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const included = item.includedPeople || [];
          return { ...item, includedPeople: checked ? [...included, personId] : included.filter((id) => id !== personId) };
        }
        return item;
      })
    );
  };

  const selectAllPeople = (itemId: string, checked: boolean) => {
    setItems(
      items.map((item) => (item.id === itemId ? { ...item, includedPeople: checked ? validPeople.map((p) => p.id) : [] } : item))
    );
  };

  const canCalculate = items.some((i) => i.name.trim() && i.price > 0 && (i.includedPeople?.length || 0) > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <Card className="animate-in fade-in-50 duration-300">
          <CardHeader>
            <CardTitle>Assign Items to People</CardTitle>
            <p className="text-sm text-gray-600">Select who should be included in each item's cost</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => {
              const allSelected = validPeople.every((person) => (item.includedPeople || []).includes(person.id));
              const someSelected = validPeople.some((person) => (item.includedPeople || []).includes(person.id));
              const bill = bills.find((b) => b.id === item.billId);
              return (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-600">₹{item.price} • {bill?.name}</p>
                    </div>
                    <div className="text-sm text-gray-500">{(item.includedPeople || []).length} selected</div>
                  </div>

                  <Collapsible open={openDropdowns[item.id]} onOpenChange={() => toggleDropdown(item.id)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between bg-transparent">
                        Include in cost
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2">
                        <div className="flex items-center space-x-2 pb-2 border-b">
                          <Checkbox
                            id={`select-all-${item.id}`}
                            checked={allSelected}
                            ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                            onCheckedChange={(checked) => selectAllPeople(item.id, checked as boolean)}
                          />
                          <Label htmlFor={`select-all-${item.id}`} className="text-sm font-medium">Select All</Label>
                        </div>
                        {validPeople.map((person) => (
                          <div key={person.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${item.id}-${person.id}`}
                              checked={(item.includedPeople || []).includes(person.id)}
                              onCheckedChange={(checked) => updateItemIncludedPeople(item.id, person.id, checked as boolean)}
                            />
                            <Label htmlFor={`${item.id}-${person.id}`} className="text-sm flex-1">{person.name}</Label>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {(item.includedPeople || []).length > 0 && (
                    <div className="text-sm text-gray-600">Cost per person: ₹{(item.price / (item.includedPeople || []).length).toFixed(2)}</div>
                  )}
                </div>
              );
            })}

            <div className="flex gap-2">
              <Link href="/individual/bills" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              </Link>
              <Link href="/individual/results" className="flex-1">
                <Button className="w-full" disabled={!canCalculate}>Calculate</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


