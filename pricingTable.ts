import { setUser } from "../../Helpers/localStorage"
import { logOut } from "../../services/firebase"

// export const TEAMS_PLAN = "teams"
export const STANDARD_PLAN = "standard"
export const STANDARD_PLUS_PLAN = "standardPlus"

export const PROFESSIONAL_PLAN = "professional"
export const FREE_PLAN = "free"
export const STARTER_PLAN = "starter"
export const EXPERT_PLAN = "expert"
export const ENTERPRISE_PLAN = "enterprise"

export const pricingTable = {
  free: {
    default: true,
    id: FREE_PLAN,
    name: "Free",
    rates: {
      GBP: {
        monthly: "£0.00",
        yearly: "£0.00",
        fixed: true,
      },
    },
    limits: {
      monthly: {
        users: 1,
        questionSets: 3,
        responsesSaved: 50,
      }
    },
    support: [
      "Community Forum"
    ],
  },
  professional: {
    recommended: true,
    id: PROFESSIONAL_PLAN,
    name: "Professional",
    rates: {
      GBP: {
        monthly: "£29.99",
        yearly: "£299.90",
        fixed: true,
      },
    },
    limits: {
      monthly: {
        users: 10,
        questionSets: 100,
        responsesSaved: 10000,
      }
    },
    support: [
      "Community Forum",
      "Priority Response within 24hr",
    ],
    paymentLinks: {
      GBP: {
        monthly: "https://buy.stripe.com/9AQ9CA5Bf2tDa3KbIS",
        yearly: "https://buy.stripe.com/cN26qoaVz6JT1xe4gr",
        // testing
        // monthly: "https://buy.stripe.com/test_bIYaER0aB5Jyg8geUZ",
        // yearly: "https://buy.stripe.com/test_9AQeV7cXn1tif4cbIO",
        // /ask/after-payment?stripe={CHECKOUT_SESSION_ID}&plan=professional
      },
    },
  },
  starter: {
    id: STARTER_PLAN,
    name: "Starter",
    rates: {
      GBP: {
        monthly: "£24.00",
        yearly: "£240.00",
        fixed: true,
      },
    },
    limits: {
      monthly: {
        users: 1,
        questionSets: 10,
        responsesSaved: 1000,
      }
    },
    support: [
      "Community Forum",
      "Priority Response within 24hr",
    ],
    paymentLinks: {
      GBP: {
        monthly: "https://buy.stripe.com/5kA6qobZD2tD6Ry9AM",
        yearly: "https://buy.stripe.com/dR6g0YgfT6JT5Nu8wJ",
        // Testing
        // monthly: "https://buy.stripe.com/test_aEUdR3f5v4FubS0dQX",
        // yearly: "https://buy.stripe.com/test_4gw9AN3mNgocg8g6ow",
        // /ask/after-payment?stripe={CHECKOUT_SESSION_ID}&plan=starter
      },
    },
  },
  expert: {
    id: EXPERT_PLAN,
    name: "Expert",
    rates: {
      GBP: {
        monthly: "£49.99",
        yearly: "£499.90",
        fixed: true,
      },
    },
    limits: {
      monthly: {
        users: 50,
        questionSets: 500,
        responsesSaved: "Unlimited*",
      }
    },
    support: [
      "Community Forum",
      "Priority Response within 24hr",
      "Onboarding",
      "Whatsapp support number"
    ],
    paymentLinks: {
      GBP: {
        monthly: "https://buy.stripe.com/9AQ6qod3H4BL4Jq14i",
        yearly: "https://buy.stripe.com/14k4ig7JngktcbSdR5",
        // Testing
        // monthly: "https://buy.stripe.com/test_aEU28lcXn2xm1dmbIR",
        // yearly: "https://buy.stripe.com/test_9AQ9AN2iJ2xm09idR0",
        // /ask/after-payment?stripe={CHECKOUT_SESSION_ID}&plan=expert
      },
    },
  },
  enterprise: {
    id: ENTERPRISE_PLAN,
    name: "Entreprise",
    rates: {
      GBP: {
        monthly: "POA",
        yearly: "POA",
        fixed: true,
      },
    },
    limits: {
      monthly: {
        users: "Unlimited",
        questionSets: "Unlimited",
        responsesSaved: "Unlimited*",
      }
    },
    support: [
      "API Integration",
      "Community Forum",
      "Priority Response within 24hr",
      "Onboarding",
      "Whatsapp support number",
    ],
  },
}

export const PLAN_LIMIT_QS = "questionSets"
export const PLAN_LIMIT_RESPONSES_SAVED = "responsesSaved"
export const PLAN_LIMIT_users = "users"

export function checkLimitsReached(type: string, plan: string = "free", total: number) {
  if (plan === ENTERPRISE_PLAN) {
    // TODO custom
    return 100
  }

  if (plan === EXPERT_PLAN && type === PLAN_LIMIT_RESPONSES_SAVED) {
    // TODO custom
    return 100
  }

  if (!pricingTable[plan]){
    // logOut()
    // setUser(null)
    // window.location.href = '/'
    return null
  }

  const limits = pricingTable[plan]?.limits.monthly
  // console.log(type, plan, total, limits[type])
  return limits[type] - total
}
