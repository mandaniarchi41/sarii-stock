import React, { useState, useEffect } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { format } from 'date-fns';
import { getAllHistoryEntries, deleteHistoryEntry } from '../utils/sariDB';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [historyEntryToDelete, setHistoryEntryToDelete] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await getAllHistoryEntries();
      console.log('History data received in HistoryPage:', data);
      // Sort history by timestamp descending
      data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setHistory(data);
    };

    fetchHistory();
  }, []);

  const handleDeleteHistory = async (id) => {
    // Open the confirmation dialog instead of using window.confirm
    setHistoryEntryToDelete(id);
    setOpenDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm(false);
    setHistoryEntryToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (historyEntryToDelete) {
      try {
        await deleteHistoryEntry(historyEntryToDelete);
        // Update local state to remove the deleted entry
        setHistory(history.filter(entry => entry.id !== historyEntryToDelete));
        console.log('History entry deleted successfully from UI.', historyEntryToDelete);
      } catch (error) {
        console.error('Error deleting history entry:', error);
        alert('Failed to delete history entry.');
      } finally {
        handleCloseDeleteConfirm();
      }
    }
  };

  const filteredHistory = history.filter((entry) => {
    const searchLower = searchTerm.toLowerCase();
    // Access sari name and number from newData, oldData, or sari field
    const sariName = entry.sari?.name || entry.newData?.name || entry.oldData?.name || '';
    const sariNumber = entry.sari?.sariNumber || entry.newData?.sariNumber || entry.oldData?.sariNumber || '';

    // Check if the entry contains stock change information
    const hasStockChanges = entry.changes && Array.isArray(entry.changes) &&
      entry.changes.some(change => 
        change.hasOwnProperty('oldStock') && 
        change.hasOwnProperty('newStock')
      );

    // Filter by whether it has stock changes and the search term
    return (
      hasStockChanges &&
      (
        sariName.toLowerCase().includes(searchLower) ||
        sariNumber.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <Paper elevation={3} sx={{ padding: 3, margin: 2 }} className="bg-custom-bharat-white">
      <Typography variant="h4" gutterBottom className="text-custom-bharat-dark font-serif">
        Stock Change History
      </Typography>
      <Typography variant="subtitle1" gutterBottom className="text-custom-bharat-dark font-sans">
        View only stock changes made to saris
      </Typography>
      <TextField
        label="Search by Sari Name or Number"
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-custom-bharat-white rounded-lg shadow-sm font-sans"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon className="text-custom-bharat-dark" />
            </InputAdornment>
          ),
          className: 'font-sans text-custom-bharat-dark'
        }}
        InputLabelProps={{
          className: 'font-sans text-custom-bharat-dark'
        }}
        sx={{ marginBottom: 2 }}
      />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="text-custom-bharat-dark font-sans">Date & Time</TableCell>
              <TableCell className="text-custom-bharat-dark font-sans">Sari Number</TableCell>
              <TableCell className="text-custom-bharat-dark font-sans">Sari Name</TableCell>
              <TableCell className="text-custom-bharat-dark font-sans">Stock Changes</TableCell>
              <TableCell className="text-custom-bharat-dark font-sans">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHistory.map((entry, index) => (
              <TableRow key={index}>
                {/* Use entry.timestamp for date formatting */}
                <TableCell className="text-custom-bharat-dark font-sans">{format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm')}</TableCell>
                {/* Access sari number and name from newData (or oldData as fallback) */}
                <TableCell className="text-custom-bharat-dark font-sans">{entry.sari?.sariNumber || entry.newData?.sariNumber || entry.oldData?.sariNumber}</TableCell>
                <TableCell className="text-custom-bharat-dark font-sans">{entry.sari?.name || entry.newData?.name || entry.oldData?.name}</TableCell>
                <TableCell className="text-custom-bharat-dark font-sans">
                  {
                    entry.changes && Array.isArray(entry.changes) ? (
                      entry.changes.map((change, changeIndex) => (
                        <Chip
                          key={changeIndex}
                          label={`${change.color}: ${change.oldStock} → ${change.newStock}`}
                          sx={{ margin: '2px', backgroundColor: '#F5F5F5', color: '#333333' }} // Use custom colors
                          className="bg-custom-bharat-light-gray text-custom-bharat-dark font-sans"
                        />
                      ))
                    ) : entry.changes ? (
                      // Handle non-array changes if necessary, though the goal is to focus on color stock changes
                      typeof entry.changes === 'object' ? JSON.stringify(entry.changes) : String(entry.changes)
                    ) : (
                      'N/A'
                    )
                  }
                </TableCell>
                <TableCell>
                  <IconButton
                    aria-label="delete"
                    onClick={() => handleDeleteHistory(entry.id)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" className="text-custom-bharat-dark" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {/* Add a row for no history entries */}
            {filteredHistory.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1" color="text.secondary" className="text-custom-bharat-dark font-sans">
                    No history entries found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteConfirm}
        onClose={handleCloseDeleteConfirm}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" className="text-custom-bharat-dark font-serif">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description" className="text-custom-bharat-dark font-sans">
            Are you sure you want to delete this history entry?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} className="text-custom-bharat-dark font-sans">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus className="text-custom-bharat-red font-sans">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Paper>
  );
}

export default HistoryPage; 