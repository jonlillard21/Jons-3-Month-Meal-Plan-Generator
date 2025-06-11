import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";

function App() {
  const [form, setForm] = useState({
    gender: "male",
    age: "",
    height: "",
    weight: "",
    activity: "moderate",
    goal: "fat_loss",
    diet: "standard",
    email: ""
  });
  const [results, setResults] = useState(null);
  const [unlocked, setUnlocked] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const redirectToStripe = async () => {
    if (!form.email) {
      alert("Please enter your email before unlocking.");
      return;
    }
    const stripe = await loadStripe("YOUR_STRIPE_PUBLISHABLE_KEY");
    stripe.redirectToCheckout({
      lineItems: [{ price: "YOUR_STRIPE_PRICE_ID", quantity: 1 }],
      mode: "payment",
      successUrl: window.location.href + "?unlocked=true&email=" + encodeURIComponent(form.email),
      cancelUrl: window.location.href,
      customerEmail: form.email
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("unlocked") === "true") {
      setUnlocked(true);
    }
  }, []);

  const calculateMealPlan = () => {
    const weightLbs = parseFloat(form.weight);
    const weight = weightLbs / 2.205;
    const heightInInches = parseFloat(form.height);
    const age = parseFloat(form.age);

    if (isNaN(weight) || isNaN(heightInInches) || isNaN(age)) return;

    const height = heightInInches * 2.54;
    const bmr = 10 * weight + 6.25 * height - 5 * age + (form.gender === "male" ? 5 : -161);
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const tdee = bmr * activityMultipliers[form.activity];

    const generateMeals = () => {
      const dayTemplate = [
        "Meal 1: 6 egg whites, 2 whole eggs, 40g oats, 1 tbsp peanut butter",
        "Meal 2: 6 oz grilled chicken, 150g rice, 1 tbsp olive oil",
        "Meal 3: 6 oz lean beef, 200g sweet potato, 1/2 avocado",
        "Meal 4: Whey isolate + banana + cereal",
        "Meal 5: White fish + rice + coconut oil",
        "Meal 6: Whey + almond butter"
      ];
      const swaps = {
        protein: "Protein swaps: chicken, turkey, tofu, fish, lentils, whey",
        carbs: "Carb swaps: rice, oats, sweet potatoes, quinoa, sourdough bread",
        fats: "Fat swaps: olive oil, nuts, peanut butter, avocado, coconut oil"
      };
      return Array(7).fill(dayTemplate).map((d, i) => d.map(m => m + ` (Day ${i + 1})`));
    };

    const monthlyPlans = [0, 1, 2].map(month => {
      const adjustment = 500 * (month + 1);
      const calories = form.goal === "fat_loss" ? tdee - adjustment : tdee + adjustment;
      const protein = weight * (form.goal === "fat_loss" ? 2.5 : 2.2);
      const fat = (calories * (form.goal === "fat_loss" ? 0.20 : 0.25)) / 9;
      const carbs = (calories - protein * 4 - fat * 9) / 4;

      return {
        month: month + 1,
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        cardio: form.goal === "fat_loss" ? `${3 + month} days/week @ 20 mins` : "Optional light cardio or rest",
        meals: generateMeals(),
        swaps: generateMeals().swaps
      };
    });

    setResults({ bmr: Math.round(bmr), tdee: Math.round(tdee), monthlyPlans });
    setUnlocked(false);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Segoe UI" }}>
      <h1>3-Month Meal Plan Generator</h1>
      <div>
        <label>Email:<br /><input type="email" onChange={e => handleChange("email", e.target.value)} /></label><br />
        <label>Age:<br /><input type="number" onChange={e => handleChange("age", e.target.value)} /></label><br />
        <label>Height (in):<br /><input type="number" onChange={e => handleChange("height", e.target.value)} /></label><br />
        <label>Weight (lbs):<br /><input type="number" onChange={e => handleChange("weight", e.target.value)} /></label><br />
        <button onClick={calculateMealPlan}>Generate Plan</button>
      </div>

      {results && (
        <div style={{ marginTop: 30 }}>
          <h2>BMR: {results.bmr} kcal</h2>
          <h2>TDEE: {results.tdee} kcal</h2>
          <h3>Month 1 Macros:</h3>
          <p>Calories: {results.monthlyPlans[0].calories}</p>
          <p>Protein: {results.monthlyPlans[0].protein}g</p>
          <p>Carbs: {results.monthlyPlans[0].carbs}g</p>
          <p>Fats: {results.monthlyPlans[0].fat}g</p>

          {!unlocked ? (
            <>
              <p>Unlock full plan including meals, swaps, and PDF download via email.</p>
              <button onClick={redirectToStripe}>🔓 Unlock for $9.99</button>
            </>
          ) : (
            results.monthlyPlans.map(plan => (
              <div key={plan.month}>
                <h3>Month {plan.month}</h3>
                <p>Calories: {plan.calories} kcal</p>
                <p>Protein: {plan.protein} g</p>
                <p>Carbs: {plan.carbs} g</p>
                <p>Fats: {plan.fat} g</p>
                <p>Cardio: {plan.cardio}</p>
                <h4>Meal Plan:</h4>
                {plan.meals.map((day, i) => (
                  <div key={i}>
                    <strong>Day {i + 1}</strong>
                    <ul>
                      {day.map((meal, j) => (
                        <li key={j} style={{ marginBottom: "10px" }}>{meal}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;

