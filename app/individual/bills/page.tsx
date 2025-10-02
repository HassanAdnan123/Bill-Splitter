"use client";

import { useMemo, useState } from "react";
import { useBillContext } from "@/context/BillContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { validateTotals } from "@/lib/calculations";

export default function BillsPage() {
  const { bills, setBills, items, setItems, totals } = useBillContext();
  const [csvData, setCsvData] = useState("");
  const [showCSVInput, setShowCSVInput] = useState(false);

  const addBill = () => {
    const newBill = { id: Date.now().toString(), name: `Bill ${bills.length + 1}` };
    setBills([...bills, newBill]);
  };
  const updateBill = (id: string, name: string) => setBills(bills.map((b) => (b.id === id ? { ...b, name } : b)));
  const removeBill = (id: string) => {
    if (bills.length > 1) {
      setBills(bills.filter((b) => b.id !== id));
      setItems(items.filter((i) => i.billId !== id));
    }
  };
  const addItem = (billId?: string) => {
    const newItem = { id: Date.now().toString(), name: "", price: 0, billId: billId || bills[0]?.id || "1", includedPeople: [] };
    setItems([...items, newItem]);
  };
  const updateItem = (id: string, field: "name" | "price", value: string | number) => {
    setItems(items.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const removeItem = (id: string) => {
    if (items.filter((it) => it.billId === items.find(i => i.id === id)?.billId).length > 1) {
      setItems(items.filter((it) => it.id !== id));
    }
  };

  const itemsTotal = totals.itemsTotal;
  const validation = useMemo(() => validateTotals(itemsTotal, totals.contributionsTotal, "individual"), [itemsTotal, totals.contributionsTotal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <Card className="animate-in fade-in-50 duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Add Bills</span>
              <Button variant="outline" size="sm" onClick={addBill}><Plus className="w-4 h-4" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bills.map((bill) => (
              <div key={bill.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={bill.name} onChange={(e) => updateBill(bill.id, e.target.value)} className="font-medium" placeholder="Bill Name" />
                  {bills.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => removeBill(bill.id)}>×</Button>
                  )}
                </div>

                {items.filter((i) => i.billId === bill.id).map((item) => (
                  <div key={item.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor={`item-name-${item.id}`}>Item Name</Label>
                      <Input id={`item-name-${item.id}`} placeholder="e.g., Tea" value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} />
                    </div>
                    <div className="w-24">
                      <Label htmlFor={`item-price-${item.id}`}>Price</Label>
                      <Input id={`item-price-${item.id}`} type="number" placeholder="0" value={item.price || ""} onChange={(e) => updateItem(item.id, "price", Number.parseFloat(e.target.value) || 0)} />
                    </div>
                    {items.filter((i) => i.billId === bill.id).length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => removeItem(item.id)} className="mb-0">×</Button>
                    )}
                  </div>
                ))}

                <Button variant="outline" onClick={() => addItem(bill.id)} className="w-full bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item to {bill.name}
                </Button>
              </div>
            ))}

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-green-600">{itemsTotal.toFixed(2)}</span>
            </div>

            <Alert className={validation.isValid ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
              <AlertCircle className={`h-4 w-4 ${validation.isValid ? "text-green-600" : "text-orange-600"}`} />
              <AlertDescription className={validation.isValid ? "text-green-700" : "text-orange-700"}>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Items total: {itemsTotal.toFixed(2)}</span>
                    <span>Contributions: {totals.contributionsTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-center">{validation.message}</div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Link href="/individual/people" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              </Link>
              <Link href="/individual/assign" className="flex-1">
                <Button className="w-full" disabled={!items.some((i) => i.name.trim() && i.price > 0)}>
                  Next
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


