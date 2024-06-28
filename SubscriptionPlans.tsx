import React, { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";

import {
  Box, Button, Typography, Card, CardContent, Divider, Radio,
  Grid, Switch, Snackbar
} from '@mui/material'
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LoadingButton from '@mui/lab/LoadingButton';
import { isMobile } from 'react-device-detect';
import { ENTERPRISE_PLAN, pricingTable } from './pricingTable';

import makeStyles from '@mui/styles/makeStyles';
import { getUser, setUser } from '../../Helpers/localStorage';
import { updateSubscription } from '../../services/api';
import { auth } from '../../services/firebase';
const FREE_PLAN = "free";
const useStyles = makeStyles(_ => ({
  wrapper: {
    width: "100%",
    padding: "0 20px",
  },
}))

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function SubscriptionPlans() {
  const classes = useStyles();

  const navigate = useNavigate();

  const [currentPlan, setCurrentPlan] = useState(FREE_PLAN)
  const [currentInterval, setCurrentInterval] = useState("month")

  const [chosenPlan, setChosenPlan] = useState(FREE_PLAN)
  const [chosenInterval, setChosenInterval] = useState("month")

  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [email, setEmail] = useState("")

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const user = getUser()
    // console.log("user", user.plan)
    if (user && user.plan) {
      setEmail(user.email)

      setCurrentPlan(user.plan || FREE_PLAN)
      setChosenPlan(user.plan || FREE_PLAN)

      setChosenInterval(user.interval || "month")
      setCurrentInterval(user.interval || "month")
    }
  }, [])

  const handleConfirmPlan = async () => {
    const plan = pricingTable[chosenPlan]
    console.log("plans", currentPlan, chosenPlan)
    console.log("intervals", currentInterval, chosenInterval)
    // return

    if (chosenPlan === ENTERPRISE_PLAN && currentPlan !== ENTERPRISE_PLAN) {
      window.location.href = "mailto:wo@hi9.io"
    } else if (currentPlan === FREE_PLAN && chosenPlan === FREE_PLAN) {
      // No changes
      navigate("/ask")
    } else if (currentPlan !== chosenPlan || currentInterval !== chosenInterval) {
      setLoading(true)

      // Generate token
      const authUser = auth?.currentUser
      if (!authUser) return
      const token = await authUser.getIdToken(true)

      try {
        const result = await updateSubscription({
          email,
          plan: chosenPlan,
          interval: chosenInterval,
        }, token)

        console.log("result", result)
        if (result.checkout) {
          let link = plan.paymentLinks.GBP
          link = chosenInterval === "year" ? link.yearly : link.monthly
          window.location.href = link
        } else {
          setSuccess(result.message)

          setCurrentPlan(chosenPlan)
          setCurrentInterval(chosenInterval)

          setUser({ ...(getUser() || {}), plan: chosenPlan, interval: chosenInterval })
        }

        setLoading(false)
      } catch (error: any) {
        setError(error.message)
        setLoading(false)
      }

    } else {
      console.log("no changes")
      // No changes
      navigate("/ask")
    }
  }

  function PlanCard(props: any) {
    const { plan } = props
    const width = 265
    if (!plan) {
      return <Card elevation={0} sx={{m: 1.5, display:"inline-block", backgroundColor: "transparent", height:10, width }} />
    }
    return (
      <Card key={plan.id} id={plan.id} className={ plan.id === chosenPlan ? "chosenPlan" : "plan" } sx={{ m: 1.5, display: "inline-block", borderRadius: "15px"}} 
        elevation={chosenPlan === plan.id ? 10 : 2}>
        
        <CardContent sx={{height:370, width, borderRadius: 18}} onClick={() => { setChosenPlan(plan.id) }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Radio
              disabled={loading}
              checked={chosenPlan === plan.id}
              onChange={(event) => { setChosenPlan(event.target.value) }}
              value={plan.id}
              name={"radio-buttons-" + plan.id}
              inputProps={{ 'aria-label': plan.name }}
              size="medium"
              sx={{ p: 0 }}
            />
          </Box>
          {plan.recommended &&
            <span style={{ fontSize: 12, backgroundColor: "lightgreen", padding: 6, borderRadius: 5, marginBottom: 5, marginRight: 5, textTransform: "uppercase" }}>
              Recommended
            </span>}
          {currentPlan === plan.id &&
            <span style={{ fontSize: 12, backgroundColor: "lightgray", padding: 6, borderRadius: 5, marginBottom: 5, textTransform: "uppercase" }}>
              Current
            </span>}
          <Typography sx={{ fontSize: 15, fontWeight: "bold", mt: 1 }}>{plan.name}</Typography>
          <Typography>
            <span style={{ fontSize: 30 }}>{chosenInterval === "year" ? plan.rates.GBP.yearly : plan.rates.GBP.monthly}</span>
            {plan.rates.GBP.fixed && <span style={{ fontSize: 15 }}>{" / " + chosenInterval}</span>}
          </Typography>
          {
            ![FREE_PLAN, ENTERPRISE_PLAN].includes(plan.id) && "+ VAT"
          }
          {/* <Typography sx={{ fontSize: 13, textAlign: "left" }}>Per month</Typography> */}
          <ul style={{ textAlign: "left", fontSize: 13, marginTop: 10 }}>
            <li>
              <Typography sx={{ fontSize: 13 }}>{plan.limits.monthly.users} user(s)</Typography>
            </li>
            <li>
              <Typography sx={{ fontSize: 13 }}>{plan.limits.monthly.questionSets} question sets</Typography>
            </li>
            {/* <li>
              <Typography sx={{ fontSize: 13 }}>{plan.limits.monthly.responsesSeen} responses viewed</Typography>
            </li> */}
            <li>
              <Typography sx={{ fontSize: 13 }}>{plan.limits.monthly.responsesSaved} responses saved</Typography>
            </li>
          </ul>
          <Divider />
          <ul style={{ textAlign: "left", fontSize: 13 }}>
            {plan.support.map((text: string) => {
              return (
                <li key={text}>
                  <Typography sx={{ fontSize: 13 }}>{text}</Typography>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box className={classes.wrapper}
      sx={{ display: { sm: "flex" }, flexDirection: { sm: "column" }, alignItems: { sm: "center" }, }}
    >
      <Box component="form" noValidate autoComplete="on" sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-start", alignItems: "center", my: 2 }}>
          <ArrowBackIcon sx={{ fontSize: 20, mr: 1, cursor: "pointer" }} onClick={() => { navigate("/ask") }} />
          <Typography variant='h5' sx={{ fontWeight: "bold" }}>Choose your plan</Typography>
        </Box>

        <Grid component="label" container alignItems="center" spacing={1} justifyContent="center" >
          <Grid item>
            <Typography variant="subtitle2">Monthly</Typography>
          </Grid>
          <Grid item>
            <Switch
              disabled={loading}
              checked={chosenInterval === "year"}
              onChange={(event) => {
                const newInterval = event.target.checked ? "year" : "month"
                setChosenInterval(newInterval)
              }}
              size="small"
            />
          </Grid>
          <Grid item>
            <Typography variant="subtitle2">Yearly</Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 1 }} className="PlanCards">
          {
            Object.keys(pricingTable).map((id: string) => {
              const plan = pricingTable[id]
              return <PlanCard key={id} plan={plan} />
            })
          }
          <PlanCard />
          <PlanCard />
          <PlanCard />
          <PlanCard />
          <PlanCard />
        </Box>

        <Typography variant="caption">* Fair use</Typography>

        <Box sx={{ position:"fixed", bottom:70,right:70 }}>
          <LoadingButton variant="contained" size="large" color="secondary" sx={{ my: 1, minWidth: 200 }}
            onClick={handleConfirmPlan} loading={loading}
          >
            {chosenPlan === ENTERPRISE_PLAN && currentPlan !== ENTERPRISE_PLAN ? "Contact Us" : "Continue"}
          </LoadingButton>
        </Box>

      </Box>

      {error && <Snackbar open={error !== null} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>}
      {success && <Snackbar open={success !== null} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>}
    </Box>
  )
}
