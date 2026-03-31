from langchain_core.tools import tool


@tool
def get_workout_plan(
    fitness_level: str,
    goal: str,
    days_per_week: int,
    equipment: str = "none"
) -> str:
    """
    Generate a structured workout plan.
    
    Args:
        fitness_level: beginner / intermediate / advanced
        goal: e.g. 'weight loss', 'muscle gain', 'endurance', 'flexibility'
        days_per_week: number of training days (1-7)
        equipment: 'none' (bodyweight), 'dumbbells', 'full gym', 'resistance bands'
    """
    return (
        f"Generating a {days_per_week}-day/week {goal} workout plan "
        f"for a {fitness_level} athlete with {equipment} equipment. "
        f"Please provide a detailed weekly program with sets, reps, rest periods, "
        f"and exercise progressions."
    )


@tool
def get_diet_advice(
    goal: str,
    dietary_restrictions: str = "none",
    weight_kg: float = 70.0,
    activity_level: str = "moderate"
) -> str:
    """
    Provide personalised nutrition and diet advice.
    
    Args:
        goal: 'weight loss', 'muscle gain', 'maintenance', 'performance'
        dietary_restrictions: e.g. 'vegan', 'gluten-free', 'lactose intolerant', 'none'
        weight_kg: body weight in kilograms
        activity_level: 'sedentary', 'light', 'moderate', 'active', 'very active'
    """
    return (
        f"Providing {goal} nutrition advice for a {weight_kg}kg person "
        f"with {activity_level} activity level and {dietary_restrictions} dietary restrictions. "
        f"Include macros, calorie targets, meal timing, and food examples."
    )


@tool
def get_recovery_advice(
    training_intensity: str,
    soreness_area: str = "general",
    sleep_hours: float = 7.0
) -> str:
    """
    Give advice on recovery, rest, and injury prevention.
    
    Args:
        training_intensity: 'light', 'moderate', 'heavy', 'very heavy'
        soreness_area: body area that's sore, e.g. 'legs', 'back', 'shoulders', 'general'
        sleep_hours: average hours of sleep per night
    """
    return (
        f"Providing recovery protocol for {training_intensity} training intensity "
        f"with soreness in {soreness_area} and {sleep_hours} hours of sleep. "
        f"Include active recovery, stretching, sleep optimisation, and deload strategies."
    )


@tool
def get_form_advice(exercise: str, issue: str = "general tips") -> str:
    """
    Provide exercise form guidance and technique cues.
    
    Args:
        exercise: the exercise name, e.g. 'squat', 'deadlift', 'bench press', 'pull-up'
        issue: specific form issue or 'general tips', e.g. 'lower back rounding', 'knee cave'
    """
    return (
        f"Providing detailed form guidance for {exercise} focusing on: {issue}. "
        f"Include step-by-step technique, common mistakes, safety cues, and drills to fix the issue."
    )


@tool
def calculate_macros(
    weight_kg: float,
    height_cm: float,
    age: int,
    sex: str,
    goal: str,
    activity_level: str
) -> str:
    """
    Calculate personalised daily macronutrient targets using the Mifflin-St Jeor equation.
    
    Args:
        weight_kg: body weight in kg
        height_cm: height in cm
        age: age in years
        sex: 'male' or 'female'
        goal: 'weight loss', 'maintenance', 'muscle gain'
        activity_level: 'sedentary', 'light', 'moderate', 'active', 'very active'
    """
    # Mifflin-St Jeor BMR
    if sex.lower() == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    activity_multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very active": 1.9,
    }
    multiplier = activity_multipliers.get(activity_level.lower(), 1.55)
    tdee = round(bmr * multiplier)

    goal_adjustments = {
        "weight loss": -400,
        "maintenance": 0,
        "muscle gain": +300,
    }
    adjustment = goal_adjustments.get(goal.lower(), 0)
    target_calories = tdee + adjustment

    # Macro split
    protein_g = round(weight_kg * 2.0)  # 2g per kg
    fat_g = round(target_calories * 0.25 / 9)
    carb_g = round((target_calories - protein_g * 4 - fat_g * 9) / 4)

    return (
        f"📊 Macro Targets for {goal.title()}:\n"
        f"  TDEE: {tdee} kcal | Target: {target_calories} kcal\n"
        f"  Protein: {protein_g}g | Carbs: {carb_g}g | Fat: {fat_g}g\n"
        f"  Adjust weekly based on progress and energy levels."
    )


TRAINER_TOOLS = [
    get_workout_plan,
    get_diet_advice,
    get_recovery_advice,
    get_form_advice,
    calculate_macros,
]