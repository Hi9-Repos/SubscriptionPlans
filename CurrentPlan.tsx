import React, { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";

import {
  Box, Typography, Card, CardContent, Divider, Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LoadingButton from '@mui/lab/LoadingButton';

import { ENTERPRISE_PLAN, FREE_PLAN, pricingTable } from './pricingTable';

import makeStyles from '@mui/styles/makeStyles';
import { getSetterPair, getUser, setUser } from '../../Helpers/localStorage';
import { collection, logIn, doc, fs, getDoc, logOut } from '../../services/firebase';
import { parseDate } from '../../Helpers/dates';
import { setterAuth } from '../../services/api'
import { QuestionSet } from '../../services/types';
import { getDocs, query, where } from 'firebase/firestore';
import { PermissionsEnum } from '../../Helpers/permissions';
const useStyles = makeStyles(_ => ({
  wrapper: {
    width: "100%",
    padding: "0 20px",
  },
}))

export default function CurrentPlan() {
  const classes = useStyles();

  const navigate = useNavigate();

  const [currentPlan, setCurrentPlan] = useState(pricingTable[FREE_PLAN])
  const [currentInterval, setCurrentInterval] = useState("month")
  const [user] = useState(getUser())

  const [usage, setUsage] = useState({
    questionSets: 0,
    responses: 0,
    members: 1,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // console.log("user", user.plan)
    logIn().then((resultFB: any) => {
      console.log("result", resultFB)
      resultFB?.user.getIdToken().then((token) => {
        console.log("token", token)
        if (!token) {
          logOut()
          setUser(null)
          navigate("/ask")
          return
        }
        setterAuth({}, token).then((res) => {
          console.log("authenticated ***", res)
          const setterId = res.setterId || user.setterId
          const plan = res.plan || user.plan || FREE_PLAN

          setUser({ ...user, plan, setterId})
          setCurrentPlan(pricingTable[plan || FREE_PLAN])
          setCurrentInterval(user.interval || "month")
          getUsageStats(user.email, plan || FREE_PLAN, setterId)
        }).catch((err) => {
          console.error("error ***", err)
          logOut()
          setUser(null)
          navigate("/ask")
        })
        setCurrentPlan(pricingTable[user.plan || FREE_PLAN])
        setCurrentInterval(user.interval || "month")
        getUsageStats(user.email, user.plan || FREE_PLAN, user.setterId)
      })
    }).catch((err) => {
      console.error("error ***", err)
      logOut()
      setUser(null)
      navigate("/ask")
    })
  }, [user])

  async function getUsageStats(email: string, plan: string, setterId: string) {
    setLoading(true)
    // Get setter
    const setter = (await getDoc(doc(fs, "setters", setterId)))?.data()

    const currMonth = (new Date()).getMonth()
    const currYear = (new Date()).getFullYear()

    // Get the question sets
    let questionSets = setter?.questionSets || []

    questionSets = await Promise.all(questionSets.map(async (qs: string) => {
      return (await getDoc(doc(fs, "questionSets", qs)))?.data()
    }))
    questionSets = questionSets.filter((qs: any) => qs)
    // console.log("this month's qs", questionSets)

    /* // Find current month's question sets
    const monthQS = questionSets.filter((qs: QuestionSet) => {
      return parseDate(qs.created).month() === currMonth
        && parseDate(qs.created).year() === currYear
    }) || []

    console.log("this month's qs", monthQS?.length) */

    // Find current month's responses
    const pair = await getSetterPair(email)
    const responses: number = await new Promise(async (resolve) => {

      const q = collection(fs, "answers", pair.pub, "hash")
      const data = await getDocs(q)

      if (data.empty) resolve(0)

      let answers: any[] = [];
      data.forEach((doc) => {
        answers.push({
          answerId: doc.id,
          created: doc.data().created
        })
      });

      const monthAnswers = answers.filter((ans: any) => {
        return parseDate(ans.created).month() === currMonth
          && parseDate(ans.created).year() === currYear
      }) || []

      resolve(monthAnswers?.length || 0)
    })

    // Get users number
    const membersRef = collection(fs, "members")
    const membersQuery = query(membersRef, where('setterId', '==', user.setterId));
    const members = await getDocs(membersQuery);

    setUsage({
      questionSets: questionSets?.length || 0,
      responses: responses || 0,
      members: members?.size || 0
    })
    setLoading(false)
  }

  return (
    <Box className={classes.wrapper}
      sx={{ display: { sm: "flex" }, flexDirection: { sm: "column" }, alignItems: { sm: "center" }, }}
    >
      <Box component="form" noValidate autoComplete="on" sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-start", alignItems: "center", my: 2 }}>
          <ArrowBackIcon sx={{ fontSize: 20, mr: 1, cursor: "pointer" }} onClick={() => { navigate("/ask") }} />
          <Typography variant='h5' sx={{ fontWeight: "bold" }}>Current plan</Typography>
        </Box>

        <Card id={currentPlan.id} sx={{ mb: 1.5, backgroundColor: "#f6f0fd", borderRadius: "18px" }}>
          <CardContent  sx={{height:370, width: "100%"}}>
            <Typography>
              {currentPlan.name}
            </Typography>
            <Typography>
              <span style={{ fontSize: 30 }}>{currentInterval === "year" ? currentPlan.rates.GBP.yearly : currentPlan.rates.GBP.monthly}</span>
              {currentPlan.rates.GBP.fixed && <span style={{ fontSize: 15 }}>{" / " + currentInterval}</span>}
            </Typography>
            {
              currentPlan.name?.toLowerCase() === ENTERPRISE_PLAN ? <Typography sx={{ my: 2 }}>
                Custom limits
              </Typography> :
                <Box>
                  <Typography sx={{ fontSize: 13, textAlign: "left" }}>Usage:</Typography>
                  {loading ? "loading ..." : <ul style={{ textAlign: "left", fontSize: 13, marginTop: 0 }}>
                    <li>
                      <Typography sx={{ fontSize: 13 }}> {usage.members} / {currentPlan.limits.monthly.users} user(s)</Typography>
                    </li>
                    <li>
                      <Typography sx={{ fontSize: 13 }}>{usage.questionSets} / {currentPlan.limits.monthly.questionSets} question sets</Typography>
                    </li>
                    {/* <li>
                      <Typography sx={{ fontSize: 13 }}>{usage.responses} / {currentPlan.limits.monthly.responsesSeen} responses received</Typography>
                    </li> */}
                    <li>
                      <Typography sx={{ fontSize: 13 }}>{usage.responses} / {currentPlan.limits.monthly.responsesSaved} responses saved this month</Typography>
                    </li>
                  </ul>}
                </Box>

            }
            <Divider />
            <ul style={{ textAlign: "left", fontSize: 13 }}>
              {currentPlan.support.map((text: string) => {
                return (
                  <li key={text}>
                    <Typography sx={{ fontSize: 13 }}>{text}</Typography>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        {user?.permissions?.includes(PermissionsEnum.ADMIN) ? (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <LoadingButton variant="contained" size="large" color="secondary" sx={{ my: 1, minWidth: 200 }}
              onClick={() => { navigate("/ask/plans") }}
            >
              Change plan
            </LoadingButton>
          </Box>
        ) :
          (
            <Alert severity="info" sx={{ my: 2 }}>
              Please contact the admin of your team if you need to change the subscription plan!
            </Alert>
          )
        }

      </Box>
    </Box>
  )
}
