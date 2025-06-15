import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'

interface User {
  id: string
  name: string
  email: string
  role: string
}

const initialUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
]

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
  })

  const handleOpen = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        role: '',
      })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingUser(null)
  }

  const handleSubmit = () => {
    if (editingUser) {
      setUsers(users.map(user =>
        user.id === editingUser.id
          ? { ...user, ...formData }
          : user
      ))
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        ...formData,
      }
      setUsers([...users, newUser])
    }
    handleClose()
  }

  const handleDelete = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add User
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpen(user)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(user.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Role"
            fullWidth
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Save Changes' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 