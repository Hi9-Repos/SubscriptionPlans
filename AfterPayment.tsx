import React, { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";

import {
  Box, CircularProgress, Alert, Typography, Button
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { getUser, setUser } from '../../Helpers/localStorage';
import { connectSetterStripe } from '../../services/api';
import { auth } from '../../services/firebase';

export default function AfterPayment() {
  const navigate = useNavigate();

  const [plan, setPlan] = useState("")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    updateSetter()
  }, [])

  const updateSetter = async () => {
    console.log("updateSetter")
    setLoading(true)
    setError(null)

    const params = new URLSearchParams(window.location.search)
    const stripe = params.get("stripe")
    const plan = params.get("plan") || ""
    setPlan(plan)

    const user = getUser()

    console.log("stripe", stripe)
    console.log("plan", plan)
    console.log("user", user)

    if (user && user.email && stripe && plan) {

      try {
        if (!user) throw new Error("Not logged in")
        const {token} = user

        const result = await connectSetterStripe({
          plan,
          checkout: stripe,
          email: user.email,
        }, token)
        console.log("result", result)

        setLoading(false)
        // Update local storage with new plan
        setUser({ ...(getUser() || {}), plan: result.plan, interval: result.interval })
      } catch (error: any) {
        setLoading(false)
        setError(error.message)
      }
    } else {
      setLoading(false)
      setError("Invalid URL" as any)
    }
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: "1", width: "100%", pt: 10 }}>
      {loading ? (
        <Box>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Typography onClick={() => { updateSetter() }}>
            Try again
          </Typography>
          or

          <Typography onClick={(e) => {
            e.preventDefault();
            window.location.href = "mailto:wo@hi9.io";
          }}>
            Contact us
          </Typography>

        </Box>
      ) : (
        <Box>
          <Alert severity="success" sx={{ mb: 1 }}>Success!</Alert>
          You have chosen the {plan} plan.

          <Button style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none"}}
            href="/ask"
          >
            <Typography variant="subtitle2">
              Go to home
            </Typography>
            <ArrowForwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
          </Button>
        </Box>
      )}
    </Box>
  )
}
