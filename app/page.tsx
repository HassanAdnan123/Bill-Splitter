"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Receipt } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex-1">Bill Splitter</h1>
        </div>
        <Card className="animate-in fade-in-50 duration-300">
          <CardHeader>
            <CardTitle>Choose Split Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/per-head/items">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold">Per Head Split</div>
                  <div className="text-sm text-gray-600">Split total equally among everyone</div>
                </div>
              </Button>
            </Link>

            <Link href="/individual/people">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50">
                <Receipt className="w-8 h-8 text-green-600" />
                <div className="text-center">
                  <div className="font-semibold">Individual Items Payment</div>
                  <div className="text-sm text-gray-600">Pay only for items you consumed</div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


