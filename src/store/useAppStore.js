import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const defaultHisProfile = {
  name: 'Luke',
  currentWeight: '',
  goalWeight: '',
  heightFt: '',
  heightIn: '',
  age: '',
  sex: 'male',
  activityLevel: 'moderate',
}

const defaultHersProfile = {
  name: 'Mary',
  currentWeight: '',
  goalWeight: '',
  heightFt: '',
  heightIn: '',
  age: '',
  sex: 'female',
  activityLevel: 'moderate',
}

const defaultUserData = (profile) => ({
  profile,
  calorieGoal: profile.sex === 'female' ? 1600 : 2000,
  foodLog: {},
  waterGoalOz: 64,
  waterLog: {},
  sleepLog: {},
  exerciseLog: {},
  fastingProtocol: profile.sex === 'female' ? '14:10' : '16:8',
  fastingStart: null,
  fastingLog: [],
})

const useAppStore = create(
  persist(
    (set, get) => ({
      activeUser: 'his',
      setActiveUser: (user) => set({ activeUser: user }),

      users: {
        his: defaultUserData(defaultHisProfile),
        hers: {
          ...defaultUserData(defaultHersProfile),
          cycleData: {
            lastPeriodStart: null,
            cycleLength: 28,
          },
        },
      },

      // Generic user updater
      _updateUser: (user, updater) =>
        set((s) => ({
          users: { ...s.users, [user]: updater(s.users[user]) },
        })),

      // Profile
      setProfile: (user, updates) =>
        get()._updateUser(user, (u) => ({ ...u, profile: { ...u.profile, ...updates } })),
      setCalorieGoal: (user, cal) =>
        get()._updateUser(user, (u) => ({ ...u, calorieGoal: cal })),

      // Food log
      addFoodEntry: (user, date, entry) =>
        get()._updateUser(user, (u) => ({
          ...u,
          foodLog: {
            ...u.foodLog,
            [date]: [...(u.foodLog[date] || []), { ...entry, id: Date.now() }],
          },
        })),
      removeFoodEntry: (user, date, id) =>
        get()._updateUser(user, (u) => ({
          ...u,
          foodLog: {
            ...u.foodLog,
            [date]: (u.foodLog[date] || []).filter((e) => e.id !== id),
          },
        })),

      // Water
      addWater: (user, date, oz) =>
        get()._updateUser(user, (u) => ({
          ...u,
          waterLog: { ...u.waterLog, [date]: (u.waterLog[date] || 0) + oz },
        })),
      resetWater: (user, date) =>
        get()._updateUser(user, (u) => ({
          ...u,
          waterLog: { ...u.waterLog, [date]: 0 },
        })),
      setWaterGoal: (user, oz) =>
        get()._updateUser(user, (u) => ({ ...u, waterGoalOz: oz })),

      // Sleep
      logSleep: (user, date, entry) =>
        get()._updateUser(user, (u) => ({
          ...u,
          sleepLog: { ...u.sleepLog, [date]: entry },
        })),

      // Exercise
      toggleExercise: (user, date) =>
        get()._updateUser(user, (u) => ({
          ...u,
          exerciseLog: { ...(u.exerciseLog || {}), [date]: !(u.exerciseLog || {})[date] },
        })),

      // Fasting
      setFastingProtocol: (user, protocol) =>
        get()._updateUser(user, (u) => ({ ...u, fastingProtocol: protocol })),
      startFast: (user) =>
        get()._updateUser(user, (u) => ({ ...u, fastingStart: new Date().toISOString() })),
      stopFast: (user) =>
        get()._updateUser(user, (u) => {
          if (!u.fastingStart) return u
          const endTime = new Date().toISOString()
          const durationMs = new Date(endTime).getTime() - new Date(u.fastingStart).getTime()
          const date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
          const entry = { id: Date.now(), protocol: u.fastingProtocol, startTime: u.fastingStart, endTime, durationMs, date }
          return { ...u, fastingStart: null, fastingLog: [...(u.fastingLog || []), entry] }
        }),
      addPastFast: (user, entry) =>
        get()._updateUser(user, (u) => ({
          ...u,
          fastingLog: [...(u.fastingLog || []), { ...entry, id: Date.now() }]
            .sort((a, b) => b.startTime.localeCompare(a.startTime)),
        })),
      deleteFastEntry: (user, id) =>
        get()._updateUser(user, (u) => ({
          ...u,
          fastingLog: (u.fastingLog || []).filter(e => e.id !== id),
        })),

      // Cycle (hers only)
      setCycleData: (updates) =>
        get()._updateUser('hers', (u) => ({
          ...u,
          cycleData: { ...u.cycleData, ...updates },
        })),

      // Shared family data
      dinners: [
        { id: 1, name: 'Grilled Chicken & Veggies', calories: 420, protein: 45, cookTime: 25, tags: ['kids', 'healthy'], ingredients: ['chicken breast', 'broccoli', 'olive oil'] },
        { id: 2, name: 'Spaghetti Bolognese', calories: 580, protein: 32, cookTime: 40, tags: ['kids', 'family'], ingredients: ['ground beef', 'pasta', 'tomato sauce'] },
        { id: 3, name: 'Salmon & Rice', calories: 490, protein: 38, cookTime: 20, tags: ['healthy'], ingredients: ['salmon', 'brown rice', 'lemon'] },
        { id: 4, name: 'Fruit Parfait', calories: 180, protein: 8, cookTime: 5, tags: ['dessert', 'healthy', 'fruit'], ingredients: ['greek yogurt', 'berries', 'granola'] },
        { id: 5, name: 'Banana Nice Cream', calories: 140, protein: 2, cookTime: 5, tags: ['dessert', 'fruit', 'kids'], ingredients: ['frozen banana', 'almond milk'] },
      ],
      addDinner: (dinner) =>
        set((s) => ({ dinners: [...s.dinners, { ...dinner, id: Date.now(), ratings: {} }] })),
      rateDinner: (id, category, score) =>
        set((s) => ({
          dinners: s.dinners.map((d) =>
            d.id === id ? { ...d, ratings: { ...(d.ratings || {}), [category]: score } } : d
          ),
        })),

      mealPlan: {},
      setMealPlanSlot: (day, meal, value) =>
        set((s) => ({
          mealPlan: {
            ...s.mealPlan,
            [day]: { ...(s.mealPlan[day] || {}), [meal]: value },
          },
        })),
    }),
    {
      name: 'food-planner-storage-v2',
      version: 1,
      migrate: (state) => {
        // Patch names without wiping any other data
        if (state?.users?.his?.profile) {
          const n = state.users.his.profile.name
          if (!n || n === '') state.users.his.profile.name = 'Luke'
        }
        if (state?.users?.hers?.profile) {
          const n = state.users.hers.profile.name
          if (!n || n === '' || n === 'Wife') state.users.hers.profile.name = 'Mary'
        }
        return state
      },
    }
  )
)

export default useAppStore
