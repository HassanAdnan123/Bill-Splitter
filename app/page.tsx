"use client"

import type React from "react"

import { useState, useMemo } from "react"
import {
  Plus,
  Copy,
  Check,
  Edit3,
  AlertCircle,
  Users,
  Receipt,
  Camera,
  ChevronDown,
  Eye,
  ArrowLeft,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Bill {
  id: string
  name: string
}

interface Item {
  id: string
  name: string
  price: number
  billId?: string // For individual items mode
  includedPeople?: string[] // For individual items mode
}

interface Person {
  id: string
  name: string
  contribution?: number // Amount they actually paid
}

interface Result {
  name: string
  amount: number
  type: "pay" | "receive"
}

type Mode = "per-head" | "individual-items"
type Screen = "mode-selection" | "items" | "people" | "bill" | "assign-items" | "results"

export default function BillSplitter() {
  const [mode, setMode] = useState<Mode>("per-head")
  const [currentScreen, setCurrentScreen] = useState<Screen>("mode-selection")
  const [bills, setBills] = useState<Bill[]>([{ id: "1", name: "Bill 1" }])
  const [items, setItems] = useState<Item[]>([{ id: "1", name: "", price: 0, billId: "1", includedPeople: [] }])
  const [people, setPeople] = useState<Person[]>([{ id: "1", name: "", contribution: 0 }])
  const [results, setResults] = useState<Result[]>([])
  const [copied, setCopied] = useState(false)
  const [personCopied, setPersonCopied] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({})
  const [selectedPersonPreview, setSelectedPersonPreview] = useState<string>("")
  const [selectedItemsPreview, setSelectedItemsPreview] = useState<string>("all")
  const [showCSVInput, setShowCSVInput] = useState(false)
  const [csvData, setCsvData] = useState("")

  const total = items.reduce((sum, item) => sum + (item.price || 0), 0)
  const totalContributions = people.reduce((sum, person) => sum + (person.contribution || 0), 0)

  // Check if there's any user input to show back button
  const hasUserInput = useMemo(() => {
    const hasItems = items.some((item) => item.name.trim() || item.price > 0)
    const hasPeople = people.some((person) => person.name.trim() || (person.contribution || 0) > 0)
    const hasBills = bills.some((bill) => bill.name !== "Bill 1")
    return hasItems || hasPeople || hasBills
  }, [items, people, bills])

  // Real-time validation for per-head mode
  const contributionValidation = useMemo(() => {
    if (mode !== "per-head") return { isValid: true, difference: 0, message: "" }

    const difference = Math.abs(total - totalContributions)
    const isValid = difference < 0.01
    return {
      isValid,
      difference,
      message:
        total > totalContributions
          ? `Missing ${(total - totalContributions).toFixed(2)} in contributions`
          : total < totalContributions
            ? `Excess ${(totalContributions - total).toFixed(2)} in contributions`
            : "Contributions match total!",
    }
  }, [total, totalContributions, mode])

  // Real-time validation for individual-items mode contributions
  const contributionValidationIndividual = useMemo(() => {
    if (mode !== "individual-items") return { isValid: true, difference: 0, message: "" }

    const difference = Math.abs(total - totalContributions)
    const isValid = difference < 0.01
    return {
      isValid,
      difference,
      message:
        total > totalContributions
          ? `Missing ${(total - totalContributions).toFixed(2)} in contributions`
          : total < totalContributions
            ? `Excess ${(totalContributions - total).toFixed(2)} in contributions`
            : "Contributions match items total!",
    }
  }, [total, totalContributions, mode])

  // Get items breakdown for each person
  const getPersonItemsBreakdown = (personId: string) => {
    const validPeople = people.filter((p) => p.name.trim())
    const person = validPeople.find((p) => p.id === personId)
    if (!person) return []

    return items
      .filter((item) => item.name.trim() && item.price > 0 && item.includedPeople?.includes(personId))
      .map((item) => {
        const includedCount = item.includedPeople?.length || 1
        const costPerPerson = item.price / includedCount
        const bill = bills.find((b) => b.id === item.billId)
        return {
          name: item.name,
          billName: bill?.name || "Unknown Bill",
          totalCost: item.price,
          personalCost: costPerPerson,
          splitInfo: includedCount > 1 ? `${item.price.toFixed(2)} divided by ${includedCount}` : null,
        }
      })
  }

  const parseCSV = (csvText: string) => {
    return csvText
      .trim()
      .split("\n")
      .map((line) => line.split(",").map((cell) => cell.trim()))
      .filter((row) => row.length > 1 && row[0]) // Filter out empty rows
  }

  const importPeopleFromCSV = () => {
    try {
      const rows = parseCSV(csvData)
      const newPeople = rows.map((row, index) => ({
        id: `csv-${Date.now()}-${index}`,
        name: row[0],
        contribution: Number.parseFloat(row[1]) || 0,
      }))

      if (newPeople.length > 0) {
        setPeople(newPeople)
        setCsvData("")
        setShowCSVInput(false)
      }
    } catch (error) {
      alert("Error parsing CSV. Please check the format.")
    }
  }

  const importItemsFromCSV = () => {
    try {
      const rows = parseCSV(csvData)
      const firstBillId = bills[0]?.id || "1"
      const newItems = rows.map((row, index) => ({
        id: `csv-${Date.now()}-${index}`,
        name: row[0],
        price: Number.parseFloat(row[1]) || 0,
        ...(mode === "individual-items" && { billId: firstBillId, includedPeople: [] }),
      }))

      if (newItems.length > 0) {
        setItems(newItems)
        setCsvData("")
        setShowCSVInput(false)
      }
    } catch (error) {
      alert("Error parsing CSV. Please check the format.")
    }
  }

  const selectMode = (selectedMode: Mode) => {
    setMode(selectedMode)
    if (selectedMode === "per-head") {
      setCurrentScreen("items")
      setItems([{ id: "1", name: "", price: 0 }])
      setPeople([{ id: "1", name: "", contribution: 0 }])
      setBills([])
    } else {
      setCurrentScreen("people")
      setItems([{ id: "1", name: "", price: 0, billId: "1", includedPeople: [] }])
      setPeople([{ id: "1", name: "", contribution: 0 }])
      setBills([{ id: "1", name: "Bill 1" }])
    }
    setResults([])
    setSelectedPersonPreview("")
    setSelectedItemsPreview("all")
  }

  const addBill = () => {
    const newBill = {
      id: Date.now().toString(),
      name: `Bill ${bills.length + 1}`,
    }
    setBills([...bills, newBill])
  }

  const updateBill = (id: string, name: string) => {
    setBills(bills.map((bill) => (bill.id === id ? { ...bill, name } : bill)))
  }

  const removeBill = (id: string) => {
    if (bills.length > 1) {
      setBills(bills.filter((bill) => bill.id !== id))
      // Remove items from this bill
      setItems(items.filter((item) => item.billId !== id))
    }
  }

  const toggleDropdown = (itemId: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  const handleNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent arrow keys from changing the value
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
    }
    // Allow only numbers, decimal point, backspace, delete, tab, escape, enter
    if (
      !/[0-9]/.test(e.key) &&
      e.key !== "." &&
      e.key !== "Backspace" &&
      e.key !== "Delete" &&
      e.key !== "Tab" &&
      e.key !== "Escape" &&
      e.key !== "Enter" &&
      !e.ctrlKey
    ) {
      e.preventDefault()
    }
  }

  const addItem = (billId?: string) => {
    const newItem =
      mode === "individual-items"
        ? { id: Date.now().toString(), name: "", price: 0, billId: billId || bills[0]?.id || "1", includedPeople: [] }
        : { id: Date.now().toString(), name: "", price: 0 }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, field: "name" | "price", value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const updateItemIncludedPeople = (itemId: string, personId: string, checked: boolean) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const includedPeople = item.includedPeople || []
          return {
            ...item,
            includedPeople: checked ? [...includedPeople, personId] : includedPeople.filter((id) => id !== personId),
          }
        }
        return item
      }),
    )
  }

  const selectAllPeople = (itemId: string, checked: boolean) => {
    const validPeople = people.filter((p) => p.name.trim())
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            includedPeople: checked ? validPeople.map((p) => p.id) : [],
          }
        }
        return item
      }),
    )
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const addPerson = () => {
    const newPerson = { id: Date.now().toString(), name: "", contribution: 0 }
    setPeople([...people, newPerson])
  }

  const updatePerson = (id: string, field: "name" | "contribution", value: string | number) => {
    setPeople(people.map((person) => (person.id === id ? { ...person, [field]: value } : person)))
  }

  const removePerson = (id: string) => {
    if (people.length > 1) {
      setPeople(people.filter((person) => person.id !== id))
      // Remove person from all item includedPeople
      if (mode === "individual-items") {
        setItems(
          items.map((item) => ({
            ...item,
            includedPeople: (item.includedPeople || []).filter((personId) => personId !== id),
          })),
        )
      }
    }
  }

  const goBack = () => {
    if (currentScreen === "people" && mode === "per-head") {
      setCurrentScreen("items")
    } else if (currentScreen === "people" && mode === "individual-items") {
      setCurrentScreen("mode-selection")
    } else if (currentScreen === "bill" && mode === "individual-items") {
      setCurrentScreen("people")
    } else if (currentScreen === "assign-items" && mode === "individual-items") {
      setCurrentScreen("bill")
    } else if (currentScreen === "results") {
      setCurrentScreen(mode === "per-head" ? "people" : "assign-items")
    } else {
      setCurrentScreen("mode-selection")
    }
  }

  const goHome = () => {
    if (hasUserInput) {
      if (confirm("Your progress will be lost. Are you sure you want to go home?")) {
        resetApp()
      }
    } else {
      resetApp()
    }
  }

  const goToNextScreen = () => {
    if (currentScreen === "items" && mode === "per-head") {
      const validItems = items.filter((item) => item.name.trim() && item.price > 0)
      if (validItems.length > 0) {
        setItems(validItems)
        setCurrentScreen("people")
      }
    } else if (currentScreen === "people" && mode === "individual-items") {
      const validPeople = people.filter((person) => person.name.trim())
      if (validPeople.length > 0) {
        setPeople(validPeople)
        setCurrentScreen("bill")
      }
    } else if (currentScreen === "bill" && mode === "individual-items") {
      const validItems = items.filter((item) => item.name.trim() && item.price > 0)
      if (validItems.length > 0) {
        setItems(validItems)
        setCurrentScreen("assign-items")
      }
    }
  }

  const calculateResults = () => {
    const validPeople = people.filter((person) => person.name.trim())
    if (validPeople.length === 0) return

    let calculatedResults: Result[] = []

    if (mode === "per-head") {
      if (!contributionValidation.isValid) return

      const perPersonShare = total / validPeople.length
      calculatedResults = validPeople
        .map((person) => {
          const difference = (person.contribution || 0) - perPersonShare
          return {
            name: person.name,
            amount: Math.abs(difference),
            type: difference >= 0 ? "receive" : "pay",
          }
        })
        .filter((result) => result.amount > 0.01)
    } else {
      // Individual items calculation
      const personObligations: { [key: string]: number } = {}

      // Initialize all people with 0
      validPeople.forEach((person) => {
        personObligations[person.id] = 0
      })

      // Calculate each person's obligation from items
      items.forEach((item) => {
        if (item.name.trim() && item.price > 0 && item.includedPeople && item.includedPeople.length > 0) {
          const sharePerPerson = item.price / item.includedPeople.length
          item.includedPeople.forEach((personId) => {
            if (personObligations[personId] !== undefined) {
              personObligations[personId] += sharePerPerson
            }
          })
        }
      })

      // Calculate differences (paid - obligation)
      calculatedResults = validPeople
        .map((person) => {
          const obligation = personObligations[person.id] || 0
          const paid = person.contribution || 0
          const difference = paid - obligation
          return {
            name: person.name,
            amount: Math.abs(difference),
            type: difference >= 0 ? "receive" : "pay",
          }
        })
        .filter((result) => result.amount > 0.01)
    }

    setResults(calculatedResults)
    setCurrentScreen("results")
  }

  const copyPersonSummary = async () => {
    if (!selectedPersonPreview) return

    const selectedPerson = people.find((p) => p.id === selectedPersonPreview)
    if (!selectedPerson) return

    const breakdown = getPersonItemsBreakdown(selectedPersonPreview)
    const itemsTotal = breakdown.reduce((sum, item) => sum + item.personalCost, 0)
    const amountPaid = selectedPerson.contribution || 0
    const difference = amountPaid - itemsTotal

    let text = `${selectedPerson.name}'s Bill Summary\n\n`
    text += `Items:\n`
    breakdown.forEach((item) => {
      text += `- ${item.name} (₹${item.personalCost.toFixed(2)}`
      if (item.splitInfo) {
        text += ` - ${item.splitInfo}`
      }
      text += `)\n`
    })
    text += `\nItems total: ₹${itemsTotal.toFixed(2)}\n`
    text += `Amount ${selectedPerson.name} has paid: ₹${amountPaid.toFixed(2)}\n`
    text += `Amount to ${difference >= 0 ? "receive" : "pay"}: ₹${Math.abs(difference).toFixed(2)}\n`

    try {
      await navigator.clipboard.writeText(text)
      setPersonCopied(true)
      setTimeout(() => setPersonCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const resetApp = () => {
    setCurrentScreen("mode-selection")
    setItems([{ id: "1", name: "", price: 0, billId: "1", includedPeople: [] }])
    setPeople([{ id: "1", name: "", contribution: 0 }])
    setBills([{ id: "1", name: "Bill 1" }])
    setResults([])
    setMode("per-head")
    setOpenDropdowns({})
    setSelectedPersonPreview("")
    setSelectedItemsPreview("all")
    setShowCSVInput(false)
    setCsvData("")
  }

  const getScreenProgress = () => {
    if (currentScreen === "mode-selection") return 0
    if (mode === "per-head") {
      return currentScreen === "items" ? 1 : currentScreen === "people" ? 2 : 3
    } else {
      return currentScreen === "people" ? 1 : currentScreen === "bill" ? 2 : currentScreen === "assign-items" ? 3 : 4
    }
  }

  const progress = getScreenProgress()
  const maxProgress = mode === "per-head" ? 3 : 4

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-between mb-2">
            {currentScreen !== "mode-selection" && hasUserInput && (
              <Button variant="ghost" size="sm" onClick={goBack} className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h1 className="text-3xl font-bold text-gray-800 flex-1">Bill Splitter</h1>
            {currentScreen !== "mode-selection" && (
              <Button variant="ghost" size="sm" onClick={goHome} className="p-2">
                <Home className="w-4 h-4" />
              </Button>
            )}
          </div>
          {currentScreen !== "mode-selection" && (
            <div className="flex justify-center space-x-2">
              {Array.from({ length: maxProgress }, (_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${progress > i ? "bg-blue-500" : "bg-gray-300"}`} />
              ))}
            </div>
          )}
        </div>

        {currentScreen === "mode-selection" && (
          <Card className="animate-in fade-in-50 duration-300">
            <CardHeader>
              <CardTitle>Choose Split Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => selectMode("per-head")}
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50"
              >
                <Users className="w-8 h-8 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold">Per Head Split</div>
                  <div className="text-sm text-gray-600">Split total equally among everyone</div>
                </div>
              </Button>

              <Button
                onClick={() => selectMode("individual-items")}
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50"
              >
                <Receipt className="w-8 h-8 text-green-600" />
                <div className="text-center">
                  <div className="font-semibold">Individual Items Payment</div>
                  <div className="text-sm text-gray-600">Pay only for items you consumed</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        )}

        {currentScreen === "people" && mode === "individual-items" && (
          <Card className="animate-in fade-in-50 duration-300">
            <CardHeader>
              <CardTitle>How many persons were present at the meetup?</CardTitle>
              <p className="text-sm text-gray-600">Add people and the amount they actually paid</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {people.map((person) => (
                <div key={person.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`person-name-${person.id}`}>Person Name</Label>
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
                      onKeyDown={handleNumericInput}
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

              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCSVInput(!showCSVInput)}
                  className="w-full bg-transparent mb-2"
                >
                  {showCSVInput ? "Hide" : "Import from"} CSV
                </Button>

                {showCSVInput && (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Sample CSV format:</strong>
                      <br />
                      John,300
                      <br />
                      Jane,250
                      <br />
                      Mike,200
                    </div>
                    <textarea
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      placeholder="Paste your CSV data here..."
                      className="w-full h-24 p-2 border rounded text-sm"
                    />
                    <div className="flex gap-2">
                      <Button onClick={importPeopleFromCSV} size="sm" className="flex-1">
                        Import People
                      </Button>
                      <Button
                        onClick={() => {
                          setCsvData("")
                          setShowCSVInput(false)
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {hasUserInput && (
                  <Button variant="outline" onClick={goBack} className="flex-1 bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={goToNextScreen}
                  className="flex-1"
                  disabled={!people.some((person) => person.name.trim())}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentScreen === "bill" && mode === "individual-items" && (
          <Card className="animate-in fade-in-50 duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Add Bills</span>
                <Button variant="outline" size="sm" onClick={addBill}>
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full h-12 bg-transparent" disabled>
                <Camera className="w-5 h-5 mr-2" />
                Scan Receipt (Coming Soon)
              </Button>

              {bills.map((bill) => (
                <div key={bill.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={bill.name}
                      onChange={(e) => updateBill(bill.id, e.target.value)}
                      className="font-medium"
                      placeholder="Bill Name"
                    />
                    {bills.length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => removeBill(bill.id)}>
                        ×
                      </Button>
                    )}
                  </div>

                  {items
                    .filter((item) => item.billId === bill.id)
                    .map((item) => (
                      <div key={item.id} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label htmlFor={`item-name-${item.id}`}>Item Name</Label>
                          <Input
                            id={`item-name-${item.id}`}
                            placeholder="e.g., Tea"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, "name", e.target.value)}
                          />
                        </div>
                        <div className="w-24">
                          <Label htmlFor={`item-price-${item.id}`}>Price</Label>
                          <Input
                            id={`item-price-${item.id}`}
                            type="number"
                            placeholder="0"
                            value={item.price || ""}
                            onChange={(e) => updateItem(item.id, "price", Number.parseFloat(e.target.value) || 0)}
                            onKeyDown={handleNumericInput}
                          />
                        </div>
                        {items.filter((i) => i.billId === bill.id).length > 1 && (
                          <Button variant="outline" size="sm" onClick={() => removeItem(item.id)} className="mb-0">
                            ×
                          </Button>
                        )}
                      </div>
                    ))}

                  <Button variant="outline" onClick={() => addItem(bill.id)} className="w-full bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item to {bill.name}
                  </Button>
                </div>
              ))}

              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCSVInput(!showCSVInput)}
                  className="w-full bg-transparent mb-2"
                >
                  {showCSVInput ? "Hide" : "Import from"} CSV
                </Button>

                {showCSVInput && (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Sample CSV format:</strong>
                      <br />
                      Tea,250
                      <br />
                      Chips,300
                      <br />
                      Coffee,150
                    </div>
                    <textarea
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      placeholder="Paste your CSV data here..."
                      className="w-full h-24 p-2 border rounded text-sm"
                    />
                    <div className="flex gap-2">
                      <Button onClick={importItemsFromCSV} size="sm" className="flex-1">
                        Import Items
                      </Button>
                      <Button
                        onClick={() => {
                          setCsvData("")
                          setShowCSVInput(false)
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-green-600">{total.toFixed(2)}</span>
              </div>

              <Alert
                className={
                  contributionValidationIndividual.isValid
                    ? "border-green-200 bg-green-50"
                    : "border-orange-200 bg-orange-50"
                }
              >
                <AlertCircle
                  className={`h-4 w-4 ${contributionValidationIndividual.isValid ? "text-green-600" : "text-orange-600"}`}
                />
                <AlertDescription
                  className={contributionValidationIndividual.isValid ? "text-green-700" : "text-orange-700"}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span>Items total: {total.toFixed(2)}</span>
                      <span>Contributions: {totalContributions.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-center">{contributionValidationIndividual.message}</div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack} className="flex-1 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (!contributionValidationIndividual.isValid) {
                      if (
                        confirm(
                          `Items total (${total.toFixed(2)}) and contributions (${totalContributions.toFixed(2)}) don't match. Do you want to continue anyway?`,
                        )
                      ) {
                        goToNextScreen()
                      }
                    } else {
                      goToNextScreen()
                    }
                  }}
                  className="flex-1"
                  disabled={!items.some((item) => item.name.trim() && item.price > 0)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentScreen === "assign-items" && mode === "individual-items" && (
          <Card className="animate-in fade-in-50 duration-300">
            <CardHeader>
              <CardTitle>Assign Items to People</CardTitle>
              <p className="text-sm text-gray-600">Select who should be included in each item's cost</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const validPeople = people.filter((p) => p.name.trim())
                const allSelected = validPeople.every((person) => (item.includedPeople || []).includes(person.id))
                const someSelected = validPeople.some((person) => (item.includedPeople || []).includes(person.id))
                const bill = bills.find((b) => b.id === item.billId)

                return (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">
                          ₹{item.price} • {bill?.name}
                        </p>
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
                          {/* Select All Option */}
                          <div className="flex items-center space-x-2 pb-2 border-b">
                            <Checkbox
                              id={`select-all-${item.id}`}
                              checked={allSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = someSelected && !allSelected
                              }}
                              onCheckedChange={(checked) => selectAllPeople(item.id, checked as boolean)}
                            />
                            <Label htmlFor={`select-all-${item.id}`} className="text-sm font-medium">
                              Select All
                            </Label>
                          </div>

                          {validPeople.map((person) => (
                            <div key={person.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${item.id}-${person.id}`}
                                checked={(item.includedPeople || []).includes(person.id)}
                                onCheckedChange={(checked) =>
                                  updateItemIncludedPeople(item.id, person.id, checked as boolean)
                                }
                              />
                              <Label htmlFor={`${item.id}-${person.id}`} className="text-sm flex-1">
                                {person.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {(item.includedPeople || []).length > 0 && (
                      <div className="text-sm text-gray-600">
                        Cost per person: ₹{(item.price / (item.includedPeople || []).length).toFixed(2)}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack} className="flex-1 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={calculateResults}
                  className="flex-1"
                  disabled={
                    !items.some((item) => item.name.trim() && item.price > 0 && (item.includedPeople?.length || 0) > 0)
                  }
                >
                  Calculate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentScreen === "items" && mode === "per-head" && (
          <Card className="animate-in fade-in-50 duration-300">
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`item-name-${item.id}`}>Item Name</Label>
                    <Input
                      id={`item-name-${item.id}`}
                      placeholder="e.g., Tea"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <Label htmlFor={`item-price-${item.id}`}>Price</Label>
                    <Input
                      id={`item-price-${item.id}`}
                      type="number"
                      placeholder="0"
                      value={item.price || ""}
                      onChange={(e) => updateItem(item.id, "price", Number.parseFloat(e.target.value) || 0)}
                      onKeyDown={handleNumericInput}
                    />
                  </div>
                  {items.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => removeItem(item.id)} className="mb-0">
                      ×
                    </Button>
                  )}
                </div>
              ))}

              <Button variant="outline" onClick={() => addItem()} className="w-full bg-transparent">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>

              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCSVInput(!showCSVInput)}
                  className="w-full bg-transparent mb-2"
                >
                  {showCSVInput ? "Hide" : "Import from"} CSV
                </Button>

                {showCSVInput && (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Sample CSV format:</strong>
                      <br />
                      Tea,250
                      <br />
                      Chips,300
                      <br />
                      Coffee,150
                    </div>
                    <textarea
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      placeholder="Paste your CSV data here..."
                      className="w-full h-24 p-2 border rounded text-sm"
                    />
                    <div className="flex gap-2">
                      <Button onClick={importItemsFromCSV} size="sm" className="flex-1">
                        Import Items
                      </Button>
                      <Button
                        onClick={() => {
                          setCsvData("")
                          setShowCSVInput(false)
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-blue-600">{total.toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                {hasUserInput && (
                  <Button variant="outline" onClick={goBack} className="flex-1 bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={goToNextScreen}
                  className="flex-1"
                  disabled={!items.some((item) => item.name.trim() && item.price > 0)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentScreen === "people" && mode === "per-head" && (
          <Card className="animate-in fade-in-50 duration-300">
            <CardHeader>
              <CardTitle>Add People & Contributions</CardTitle>
              <p className="text-sm text-gray-600">Total to split: {total.toFixed(2)}</p>
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
                      onKeyDown={handleNumericInput}
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

              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCSVInput(!showCSVInput)}
                  className="w-full bg-transparent mb-2"
                >
                  {showCSVInput ? "Hide" : "Import from"} CSV
                </Button>

                {showCSVInput && (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Sample CSV format:</strong>
                      <br />
                      John,300
                      <br />
                      Jane,250
                      <br />
                      Mike,200
                    </div>
                    <textarea
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      placeholder="Paste your CSV data here..."
                      className="w-full h-24 p-2 border rounded text-sm"
                    />
                    <div className="flex gap-2">
                      <Button onClick={importPeopleFromCSV} size="sm" className="flex-1">
                        Import People
                      </Button>
                      <Button
                        onClick={() => {
                          setCsvData("")
                          setShowCSVInput(false)
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Alert
                className={
                  contributionValidation.isValid ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"
                }
              >
                <AlertCircle
                  className={`h-4 w-4 ${contributionValidation.isValid ? "text-green-600" : "text-orange-600"}`}
                />
                <AlertDescription className={contributionValidation.isValid ? "text-green-700" : "text-orange-700"}>
                  <div className="flex justify-between items-center">
                    <span>Contributions: {totalContributions.toFixed(2)}</span>
                    <span className="text-sm">{contributionValidation.message}</span>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={goBack} className="flex-1 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={calculateResults}
                  className="flex-1"
                  disabled={!people.some((person) => person.name.trim()) || !contributionValidation.isValid}
                >
                  Calculate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentScreen === "results" && (
          <Card className="animate-in fade-in-50 duration-300">
            <CardHeader>
              <CardTitle>Split Results</CardTitle>
              <p className="text-sm text-gray-600">
                {mode === "per-head" ? "Per Head Split" : "Individual Items Payment"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                {mode === "per-head" && (
                  <div className="text-center mb-4">
                    <p className="text-lg">
                      {total.toFixed(2)} ÷ {people.filter((p) => p.name.trim()).length} ={" "}
                      <span className="font-bold">
                        {(total / people.filter((p) => p.name.trim()).length).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">per person</p>
                  </div>
                )}

                {mode === "individual-items" && (
                  <div className="text-center mb-4">
                    <p className="text-lg font-bold">Total: {total.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">split by individual items</p>
                  </div>
                )}

                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div key={index} className="text-center">
                      <p className="text-base leading-relaxed">
                        {result.name} will <span className="font-bold">{result.type}</span> {result.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                  {results.length === 0 && (
                    <p className="text-center text-gray-600 py-4">
                      {mode === "per-head" ? "Everyone paid their fair share! 🎉" : "No payments needed! 🎉"}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Preview for Individual Items Mode */}
              {mode === "individual-items" && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="w-4 h-4 text-green-600" />
                    <Label className="text-sm font-medium text-green-800">Preview Items</Label>
                  </div>
                  <Select value={selectedItemsPreview} onValueChange={setSelectedItemsPreview}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select bill to view items" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      {bills.map((bill) => (
                        <SelectItem key={bill.id} value={bill.id}>
                          {bill.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="mt-3 space-y-2">
                    {items
                      .filter(
                        (item) =>
                          item.name.trim() &&
                          item.price > 0 &&
                          (selectedItemsPreview === "all" || item.billId === selectedItemsPreview),
                      )
                      .map((item, index) => {
                        const bill = bills.find((b) => b.id === item.billId)
                        const assignedPeople =
                          item.includedPeople?.map((id) => people.find((p) => p.id === id)?.name).filter(Boolean) || []

                        return (
                          <div key={index} className="text-sm bg-white p-2 rounded border">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium">{item.name}</span>
                                <span className="text-gray-600 ml-2">₹{item.price}</span>
                                {selectedItemsPreview === "all" && (
                                  <span className="text-blue-600 ml-2">• {bill?.name}</span>
                                )}
                              </div>
                            </div>
                            {assignedPeople.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">Assigned to: {assignedPeople.join(", ")}</div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Item Preview by Person for Individual Items Mode */}
              {mode === "individual-items" && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-medium text-blue-800">Preview Items by Person</Label>
                  </div>
                  <Select value={selectedPersonPreview} onValueChange={setSelectedPersonPreview}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select person to view their items" />
                    </SelectTrigger>
                    <SelectContent>
                      {people
                        .filter((p) => p.name.trim())
                        .map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {selectedPersonPreview && (
                    <div className="mt-3 space-y-2">
                      {getPersonItemsBreakdown(selectedPersonPreview).map((item, index) => (
                        <div key={index} className="text-sm bg-white p-2 rounded border">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-gray-600 ml-2">
                            (₹{item.personalCost.toFixed(2)}
                            {item.splitInfo && <span className="text-blue-600"> - {item.splitInfo}</span>})
                          </span>
                          <span className="text-green-600 ml-2">• {item.billName}</span>
                        </div>
                      ))}
                      {getPersonItemsBreakdown(selectedPersonPreview).length === 0 && (
                        <p className="text-sm text-gray-600 italic">No items assigned to this person</p>
                      )}

                      {/* Add summary information */}
                      {getPersonItemsBreakdown(selectedPersonPreview).length > 0 &&
                        (() => {
                          const selectedPerson = people.find((p) => p.id === selectedPersonPreview)
                          const itemsTotal = getPersonItemsBreakdown(selectedPersonPreview).reduce(
                            (sum, item) => sum + item.personalCost,
                            0,
                          )
                          const amountPaid = selectedPerson?.contribution || 0
                          const difference = amountPaid - itemsTotal

                          return (
                            <div className="mt-4 pt-3 border-t border-blue-200">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="font-medium">Items total:</span>
                                  <span>₹{itemsTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Amount {selectedPerson?.name} has paid:</span>
                                  <span>₹{amountPaid.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                  <span>Amount to {difference >= 0 ? "receive" : "pay"}:</span>
                                  <span className={difference >= 0 ? "text-green-600" : "text-red-600"}>
                                    ₹{Math.abs(difference).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                onClick={copyPersonSummary}
                                className="w-full mt-3 bg-transparent"
                                disabled={!selectedPersonPreview}
                              >
                                {personCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                {personCopied ? "Copied!" : "Copy Summary"}
                              </Button>
                            </div>
                          )
                        })()}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentScreen(mode === "per-head" ? "items" : "bill")}
                  className="text-xs"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit {mode === "per-head" ? "Items" : "Bills"}
                </Button>
                <Button variant="outline" onClick={() => setCurrentScreen("people")} className="text-xs">
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit People
                </Button>
                {mode === "individual-items" && (
                  <Button variant="outline" onClick={() => setCurrentScreen("assign-items")} className="text-xs">
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit Costs
                  </Button>
                )}
              </div>

              <Button onClick={resetApp} className="w-full">
                New Split
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
