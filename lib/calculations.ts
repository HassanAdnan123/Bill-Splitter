import type { Bill, Item, Person, Result, ValidationState } from "@/types/bill";

export function validateTotals(totalItems: number, totalContributions: number, context: "per-head" | "individual"): ValidationState {
  const difference = Math.abs(totalItems - totalContributions);
  const isValid = difference < 0.01;
  return {
    isValid,
    difference,
    message:
      totalItems > totalContributions
        ? `Missing ${(totalItems - totalContributions).toFixed(2)} in contributions`
        : totalItems < totalContributions
          ? `Excess ${(totalContributions - totalItems).toFixed(2)} in contributions`
          : context === "per-head"
            ? "Contributions match total!"
            : "Contributions match items total!",
  };
}

export function computePerHeadResults(people: Person[], total: number): Result[] {
  const validPeople = people.filter(p => p.name.trim());
  if (validPeople.length === 0) return [];
  const perPersonShare = total / validPeople.length;
  return validPeople
    .map((person) => {
      const difference = (person.contribution || 0) - perPersonShare;
      const amount = Math.abs(difference);
      if (amount <= 0.01) return null;
      return { name: person.name, amount, type: difference >= 0 ? "receive" : "pay" as const };
    })
    .filter(Boolean) as Result[];
}

export function computeIndividualResults(people: Person[], items: Item[]): Result[] {
  const validPeople = people.filter(p => p.name.trim());
  const personObligations: Record<string, number> = {};
  validPeople.forEach(p => { personObligations[p.id] = 0; });

  items.forEach(item => {
    if (item.name.trim() && item.price > 0 && item.includedPeople && item.includedPeople.length > 0) {
      const share = item.price / item.includedPeople.length;
      item.includedPeople.forEach(pid => {
        if (personObligations[pid] !== undefined) {
          personObligations[pid] += share;
        }
      });
    }
  });

  return validPeople
    .map(person => {
      const obligation = personObligations[person.id] || 0;
      const paid = person.contribution || 0;
      const difference = paid - obligation;
      const amount = Math.abs(difference);
      if (amount <= 0.01) return null;
      return { name: person.name, amount, type: difference >= 0 ? "receive" : "pay" as const };
    })
    .filter(Boolean) as Result[];
}

export function getItemsTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + (item.price || 0), 0);
}

export function getContributionsTotal(people: Person[]): number {
  return people.reduce((sum, p) => sum + (p.contribution || 0), 0);
}

export function personItemsBreakdown(personId: string, items: Item[], bills: Bill[]) {
  return items
    .filter((i) => i.name.trim() && i.price > 0 && i.includedPeople?.includes(personId))
    .map((item) => {
      const includedCount = item.includedPeople?.length || 1;
      const costPerPerson = item.price / includedCount;
      const bill = bills.find((b) => b.id === item.billId);
      return {
        name: item.name,
        billName: bill?.name || "Unknown Bill",
        totalCost: item.price,
        personalCost: costPerPerson,
        splitInfo: includedCount > 1 ? `${item.price.toFixed(2)} divided by ${includedCount}` : null,
      };
    });
}


