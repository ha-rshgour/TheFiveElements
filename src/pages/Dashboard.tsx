import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material'

export default function Dashboard() {
  const stats = [
    { title: 'Total Users', value: '1,234', icon: <PeopleIcon /> },
    { title: 'Active Projects', value: '56', icon: <AssignmentIcon /> },
    { title: 'Notifications', value: '12', icon: <NotificationsIcon /> },
  ]

  const recentActivities = [
    { text: 'New user registered', time: '2 minutes ago' },
    { text: 'Project "Website Redesign" completed', time: '1 hour ago' },
    { text: 'System update completed', time: '3 hours ago' },
    { text: 'New feature deployed', time: '5 hours ago' },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={4} key={stat.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: 'primary.main',
                      borderRadius: '50%',
                      p: 1,
                      mr: 2,
                      color: 'white',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography variant="h6" component="div">
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <List>
                {recentActivities.map((activity, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <NotificationsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.text}
                      secondary={activity.time}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <List>
                <ListItem button>
                  <ListItemIcon>
                    <PeopleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Manage Users" />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <AssignmentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="View Projects" />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <NotificationsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Check Notifications" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
} 