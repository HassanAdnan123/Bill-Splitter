"use client";

import { useEffect, useMemo, useState } from "react";
import { useBillContext } from "@/context/BillContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Users, Check, Edit3 } from "lucide-react";
import Link from "next/link";
import { computeIndividualResults, personItemsBreakdown } from "@/lib/calculations";

export default function IndividualResultsPage() {
  const { items, people, bills, results, setResults, paymentStatuses, setPaymentStatuses } = useBillContext();
  const [selectedPersonPreview, setSelectedPersonPreview] = useState<string>("");
  const [selectedItemsPreview, setSelectedItemsPreview] = useState<string>("all");

  useEffect(() => {
    const r = computeIndividualResults(people, items);
    setResults(r);
  }, [people, items, setResults]);

  const getPaymentStatus = (personName: string) => {
    const result = results.find((r) => r.name === personName);
    if (!result) return { status: "settled", amount: 0, type: "pay" as const };
    const paidAmount = paymentStatuses[personName] || 0;
    const remainingAmount = result.amount - paidAmount;
    if (Math.abs(remainingAmount) < 0.01) return { status: "settled", amount: 0, type: result.type };
    if (remainingAmount > 0) return { status: "pending", amount: remainingAmount, type: result.type };
    return { status: "overpaid", amount: Math.abs(remainingAmount), type: result.type };
  };

  const getOverallPaymentSummary = () => {
    const summary: { needToPay: { name: string; amount: number }[]; needToReceive: { name: string; amount: number }[]; settled: string[] } = { needToPay: [], needToReceive: [], settled: [] };
    results.forEach((result) => {
      const status = getPaymentStatus(result.name);
      if (status.status === "settled") summary.settled.push(result.name);
      else if (status.status === "pending") {
        if (result.type === "pay") summary.needToPay.push({ name: result.name, amount: status.amount });
        else summary.needToReceive.push({ name: result.name, amount: status.amount });
      }
    });
    return summary;
  };

  const updatePaymentStatus = (personName: string, amount: number) => {
    setPaymentStatuses({ ...paymentStatuses, [personName]: amount });
  };

  const assignedItems = useMemo(() => items.filter(i => i.name.trim() && i.price > 0 && (selectedItemsPreview === "all" || i.billId === selectedItemsPreview)), [items, selectedItemsPreview]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <Card className="animate-in fade-in-50 duration-300">
          <CardHeader>
            <CardTitle>Split Results</CardTitle>
            <p className="text-sm text-gray-600">Individual Items Payment</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                {results.map((result, i) => (
                  <div key={i} className="text-center">
                    <p className="text-base leading-relaxed">{result.name} will <span className="font-bold">{result.type}</span> {result.amount.toFixed(2)}</p>
                  </div>
                ))}
                {results.length === 0 && (<p className="text-center text-gray-600 py-4">No payments needed! 🎉</p>)}
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <Label className="text-sm font-medium text-purple-800">Payment Status</Label>
                </div>
              </div>

              <div className="space-y-2">
                {results.map((result, index) => {
                  const status = getPaymentStatus(result.name);
                  const isSettled = status.status === "settled";
                  const needsToPay = result.type === "pay" && status.status === "pending";
                  const needsToReceive = result.type === "receive" && status.status === "pending";
                  return (
                    <div key={index} className={`p-3 rounded border ${isSettled ? "bg-green-50 border-green-200" : needsToReceive ? "bg-yellow-50 border-yellow-200" : needsToPay ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{result.name}</span>
                          {isSettled && <Check className="w-4 h-4 text-green-600" />}
                        </div>
                        <div className="text-xs text-gray-600">{result.type === "pay" ? "Should pay" : "Should receive"}: ₹{result.amount.toFixed(2)}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`payment-${index}`} className="text-xs">{result.type === "pay" ? "Amount paid:" : "Amount received:"}</Label>
                          <Input id={`payment-${index}`} type="number" placeholder="0" value={paymentStatuses[result.name] || ""} onChange={(e) => updatePaymentStatus(result.name, Number.parseFloat(e.target.value) || 0)} className={`w-24 h-8 text-xs ${needsToPay ? "border-red-300 focus:border-red-500" : needsToReceive ? "border-yellow-300 focus:border-yellow-500" : "border-green-300 focus:border-green-500"}`} />
                          <Button variant="ghost" size="sm" className="p-1 h-8 w-8" title="Edit payment amount"><Edit3 className="w-3 h-3" /></Button>
                        </div>
                        {status.status === "pending" && (
                          <div className={`text-xs ${needsToPay ? "text-red-600" : "text-orange-600"}`}>Remaining: ₹{status.amount.toFixed(2)}</div>
                        )}
                        {status.status === "overpaid" && (
                          <div className="text-xs text-blue-600">Overpaid by: ₹{status.amount.toFixed(2)}</div>
                        )}
                        {isSettled && (
                          <div className="text-xs text-green-600">✓ Payment settled (₹{(paymentStatuses[result.name] || 0).toFixed(2)})</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Link href="/individual/bills"><Button variant="outline" className="text-xs">Edit Bills</Button></Link>
              <Link href="/individual/people"><Button variant="outline" className="text-xs">Edit People</Button></Link>
              <Link href="/individual/assign"><Button variant="outline" className="text-xs">Edit Costs</Button></Link>
            </div>

            <Link href="/"><Button className="w-full">New Split</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


