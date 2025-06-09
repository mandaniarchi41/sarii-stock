import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  DialogContentText,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { addHistoryEntry } from '../utils/sariDB'; // Import addHistoryEntry

const SariDetailsPage = () => {
  const { sariId } = useParams();
  const navigate = useNavigate();
  const [sari, setSari] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sariNumber: '',
    price: '',
    imageUrl: '',
    colors: [{ color: '', stock: '', minStock: '', colorImageUrl: '' }]
  });

  useEffect(() => {
    const fetchSariDetails = async () => {
      console.log('Loading sari with ID:', sariId); // Debug log
      try {
        const response = await fetch(`http://localhost:5000/api/saris/${sariId}`); // Fetch from backend API
        if (!response.ok) {
           // Check for 404 specifically
           if (response.status === 404) {
             console.log('Sari not found with ID:', sariId); // Debug log
             setSari(null);
             return; // Stop execution if sari not found
           }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const foundSari = await response.json();
        console.log('Found sari:', foundSari); // Debug log
        setSari({ ...foundSari, id: foundSari._id });

        if (foundSari) {
          // Set form data when sari is loaded for editing
          setFormData({
            name: foundSari.name,
            sariNumber: foundSari.sariNumber,
            price: foundSari.price,
            imageUrl: foundSari.imageUrl ?? '',
            colors: foundSari.colors.map(c => ({
              color: c.color,
              stock: c.stock?.toString() ?? '',
              minStock: c.minStock?.toString() ?? '',
              colorImageUrl: c.colorImageUrl ?? ''
            })),
          });
        }

      } catch (error) {
        console.error('Error fetching sari details:', error);
        setSari(null);
        // Handle error, e.g., display an error message to the user
      }
    };

    fetchSariDetails();
  }, [sariId]); // Rerun when sariId changes

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColorChange = (index, field, value) => {
    const newColors = [...formData.colors];
    if (field === 'colorImageFile') {
      // Handle file input specifically
      const file = value;
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newColors[index] = {
            ...newColors[index],
            colorImageUrl: reader.result, // Store as Data URL
          };
          setFormData({ ...formData, colors: newColors });
        };
        reader.readAsDataURL(file);
      } else {
        // If file is removed, clear the image URL
        newColors[index] = {
          ...newColors[index],
          colorImageUrl: '',
        };
        setFormData({ ...formData, colors: newColors });
      }
    } else {
      // Handle other text inputs
      newColors[index] = {
        ...newColors[index],
        [field]: value
      };
      setFormData({ ...formData, colors: newColors });
    }
  };

  const handleAddColor = () => {
    setFormData({
      ...formData,
      colors: [...formData.colors, { color: '', stock: '', minStock: '', colorImageUrl: '' }],
    });
  };

  const handleRemoveColor = (index) => {
    const newColors = formData.colors.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      colors: newColors
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.sariNumber || !formData.price || formData.colors.some(c => !c.color || !c.stock || c.minStock === '')) {
      alert('Please fill in all required fields (Name, Sari Number, Price, Color, Stock, Minimum Stock)');
      return;
    }

    // Use _id for sending to backend
    const updatedSariData = {
      ...sari,
      _id: sariId, // Ensure _id is included for update
      name: formData.name,
      sariNumber: formData.sariNumber,
      price: parseFloat(formData.price),
      imageUrl: formData.imageUrl, // Save imageUrl
      colors: formData.colors.map(c => ({
        color: c.color,
        stock: Number(c.stock),
        minStock: Number(c.minStock),
        colorImageUrl: c.colorImageUrl // Save color image URL/Data URL
      })),
      // Backend will handle lastUpdated timestamp
    };

    // Implement retry logic for VersionError
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // Include the current version (__v) in the update request for Mongoose to check
        const dataToSend = { ...updatedSariData, __v: sari.__v };

        const response = await fetch(`http://localhost:5000/api/saris/update/${sariId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });

        if (!response.ok) {
          const errorText = await response.text();
          // Check if it's a VersionError
          if (response.status === 400 && errorText.includes('VersionError') && retries < maxRetries - 1) {
            console.warn(`VersionError detected. Retrying update for sari ${sariId}. Retry attempt ${retries + 1}/${maxRetries}`);
            retries++;
            // Fetch the latest version of the sari
            const latestResponse = await fetch(`http://localhost:5000/api/saris/${sariId}`);
             if (!latestResponse.ok) {
              throw new Error(`Failed to refetch sari details for retry: HTTP error! status: ${latestResponse.status}`);
            }
            const latestSari = await latestResponse.json();
            // Update the local sari state with the latest version and merge form data
            setSari({ ...latestSari, ...formData, _id: latestSari._id, id: latestSari._id }); // Merge form data but keep latest __v and other potential backend changes
             // Continue to the next retry loop iteration
            continue;
          } else {
             // If not a VersionError, or max retries reached, throw the error
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }
        }

        // If successful, refresh the sari details after update
        const updatedSariBackend = await response.json(); // Assuming backend returns the updated sari
         // Use _id from backend as id for frontend state consistency
        setSari({ ...updatedSariBackend, ...formData, id: updatedSariBackend._id });

        // History tracking - Use addHistoryEntry to save to IndexedDB
        const historyEntry = {
          id: Date.now(), // Unique ID for history entry
          sariId: sari._id, // Use MongoDB _id for history
          action: 'update',
           oldData: { // Capture basic old data
            _id: sari._id,
            sariNumber: sari.sariNumber,
            name: sari.name
          },
          newData: { // Capture basic new data
            _id: updatedSariBackend._id,
            sariNumber: updatedSariBackend.sariNumber,
            name: updatedSariBackend.name
          },
          timestamp: new Date().toISOString(),
        };

        // Calculate detailed color stock changes for history
        const oldColors = sari.colors || [];
        const newColors = updatedSariBackend.colors || [];
        const colorChanges = [];

        // Check for changes in existing colors and new colors
        newColors.forEach(newColor => {
          const oldColor = oldColors.find(oc => oc.color === newColor.color);
          if (!oldColor) {
            // Newly added color in update
            colorChanges.push({ color: newColor.color, oldStock: 0, newStock: newColor.stock });
          } else if (oldColor.stock !== newColor.stock) {
            // Stock change in existing color
            colorChanges.push({ color: newColor.color, oldStock: oldColor.stock, newStock: newColor.stock });
          }
        });

        // Check for removed colors (stock goes to 0)
        oldColors.forEach(oldColor => {
          const newColor = newColors.find(nc => nc.color === oldColor.color);
          if (!newColor && oldColor.stock > 0) {
            // Color removed or stock effectively 0
            colorChanges.push({ color: oldColor.color, oldStock: oldColor.stock, newStock: 0 });
          }
        });

        // Add the detailed changes to the history entry
        historyEntry.changes = colorChanges;

         await addHistoryEntry(historyEntry); // Save history to IndexedDB

        handleCloseDialog();
         // Exit the retry loop on success
        break;

      } catch (error) {
        console.error('Error updating sari:', error);
        alert('Failed to update sari.' + error.message);
         // If an error occurs that is not a VersionError or max retries reached, break the loop
        break;
      }
    }

    // If loop finishes due to max retries without success
    if (retries === maxRetries) {
        console.error('Failed to update sari after multiple retries.');
        alert('Failed to update sari after multiple attempts due to a conflict. Please try again.');
    }

  };

  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm(false);
  };

  const handleConfirmDelete = async () => {
    if (!sariId) return; // Should not happen if button is only shown when sari is loaded

    try {
      const response = await fetch(`http://localhost:5000/api/saris/${sariId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // History tracking for delete - Use addHistoryEntry to save to IndexedDB
       const historyEntry = {
        id: Date.now(), // Unique ID for history entry
        sariId: sari._id, // Use MongoDB _id for history
        action: 'delete',
         // oldData could potentially be fetched from backend before deleting if needed for full history
        oldData: { 
          _id: sari._id, 
          sariNumber: sari.sariNumber, 
          name: sari.name 
           // Add other relevant fields if needed for history display
        }, 
        newData: null,
        timestamp: new Date().toISOString(),
      };
      await addHistoryEntry(historyEntry); // Save history to IndexedDB

      navigate('/'); // Navigate back to the main inventory page
    } catch (error) {
      console.error('Error deleting sari:', error);
      alert('Failed to delete sari.' + error.message);
    } finally {
      handleCloseDeleteConfirm();
    }
  };

  const handleOpenDialog = () => {
    // When opening edit dialog, use the current sari data
    if (sari) {
      setFormData({
        name: sari.name,
        sariNumber: sari.sariNumber,
        price: sari.price,
        imageUrl: sari.imageUrl ?? '',
        colors: sari.colors.map(c => ({
          color: c.color,
          stock: c.stock?.toString() ?? '',
          minStock: c.minStock?.toString() ?? '',
          colorImageUrl: c.colorImageUrl ?? ''
        })),
      });
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    // Reset form data to current sari details when closing without save
    if (sari) {
      setFormData({
        name: sari.name,
        sariNumber: sari.sariNumber,
        price: sari.price,
        imageUrl: sari.imageUrl ?? '',
        colors: sari.colors.map(c => ({
          color: c.color,
          stock: c.stock?.toString() ?? '',
          minStock: c.minStock?.toString() ?? '',
          colorImageUrl: c.colorImageUrl ?? ''
        })),
      });
    }
  };

  if (!sari) {
    return (
      <Container className="text-center py-8 bg-custom-bharat-white text-custom-bharat-dark font-sans">
        <Typography variant="h6" className="text-custom-bharat-dark font-serif">Sari not found.</Typography>
      </Container>
    );
  }

  return (
    <Container component={Paper} elevation={3} sx={{
      padding: 4,
      backgroundColor: 'custom.bharat-white',
      color: 'custom.bharat-dark',
    }} className="bg-custom-bharat-white text-custom-bharat-dark font-sans">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom className="text-custom-bharat-dark font-serif" sx={{ color: 'custom.bharat-dark' }}>
          Sari Details
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleOpenDialog}
            className="font-sans"
            sx={{ backgroundColor: 'custom.bharat-gold', color: 'custom.bharat-dark', '&:hover': { backgroundColor: 'custom.bharat-gold' }}}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            color="error"
            onClick={() => setOpenDeleteConfirm(true)}
            className="border-custom-bharat-red text-custom-bharat-red hover:bg-red-50 font-sans"
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box>
            {sari.imageUrl ? (
              <img
                src={sari.imageUrl}
                alt={sari.name}
                className="w-full h-auto rounded-lg shadow-md object-cover"
              />
            ) : (
              <Box className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center text-custom-bharat-dark font-sans">
                No Image Available
              </Box>
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box className="space-y-4">
            <Typography variant="h6" className="text-custom-bharat-dark font-serif">{sari.name}</Typography>
            <Typography variant="body1" className="text-custom-bharat-dark font-sans"><strong>Sari Number:</strong> {sari.sariNumber}</Typography>
            <Typography variant="body1" className="text-custom-bharat-dark font-sans"><strong>Price:</strong> ₹{sari.price}</Typography>

            <Box className="space-y-2">
              <Typography variant="subtitle1" gutterBottom className="text-custom-bharat-dark font-serif">Colors & Stock:</Typography>
              <Box className="flex flex-wrap gap-4">
                {sari.colors && sari.colors.map((color, index) => (
                  <Box key={index} className="flex flex-col items-center space-y-1">
                    {color.colorImageUrl ? (
                      <img
                        src={color.colorImageUrl}
                        alt={`${color.color} - ${sari.name}`}
                        className="w-24 h-24 object-cover rounded-md shadow-sm"
                      />
                    ) : (
                      <Box className="w-24 h-24 bg-custom-bharat-light-gray rounded-md flex items-center justify-center text-custom-bharat-dark font-sans text-xs text-center p-1">
                        No {color.color} Image
                      </Box>
                    )}
                    <Chip
                      label={`${color.color} (Stock: ${color.stock}, Min: ${color.minStock})`}
                      className="font-sans text-xs"
                      sx={{ backgroundColor: 'custom.bharat-light-gray', color: 'custom.bharat-dark' }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle className="text-custom-bharat-dark font-serif">Edit Sari</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sari Number"
                name="sariNumber"
                value={formData.sariNumber}
                onChange={handleInputChange}
                className="font-sans text-custom-bharat-dark"
                InputLabelProps={{ className: 'font-sans text-custom-bharat-dark' }}
                InputProps={{ className: 'font-sans text-custom-bharat-dark' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sari Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="font-sans text-custom-bharat-dark"
                InputLabelProps={{ className: 'font-sans text-custom-bharat-dark' }}
                InputProps={{ className: 'font-sans text-custom-bharat-dark' }}
              />
            </Grid>
            <Grid item xs={12}>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-custom-bharat-dark font-sans">
                  Main Sari Image
                </label>
                <input
                  accept="image/*"
                  type="file"
                  onChange={(e) => setFormData({ ...formData, imageUrl: URL.createObjectURL(e.target.files[0]) })}
                  className="block w-full text-sm text-custom-bharat-dark
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold file:font-sans
                    file:bg-custom-bharat-gold file:text-custom-bharat-dark
                    hover:file:bg-yellow-700"
                />
                {formData.imageUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-custom-bharat-dark font-sans">Image Preview:</p>
                    <img src={formData.imageUrl} alt="Sari Preview" className="mt-2 w-full h-48 object-cover rounded-md" />
                  </div>
                )}
              </div>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                className="font-sans text-custom-bharat-dark"
                InputLabelProps={{ className: 'font-sans text-custom-bharat-dark' }}
                InputProps={{ className: 'font-sans text-custom-bharat-dark' }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom className="text-custom-bharat-dark font-serif">Colors & Stock</Typography>
              {formData.colors.map((color, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'nowrap', overflowX: 'auto' }}>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-custom-bharat-dark font-sans">
                      Color Image
                    </label>
                    <input
                      accept="image/*"
                      type="file"
                      onChange={(e) => handleColorChange(index, 'colorImageFile', e.target.files[0])}
                      className="block w-full text-sm text-custom-bharat-dark
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold file:font-sans
                        file:bg-custom-bharat-gold file:text-custom-bharat-dark
                        hover:file:bg-yellow-700"
                    />
                    {color.colorImageUrl && (
                      <div className="mt-2">
                        <p className="text-sm text-custom-bharat-dark font-sans">Image Preview:</p>
                        <img src={color.colorImageUrl} alt="Color Preview" className="mt-2 w-24 h-24 object-cover rounded-md" />
                      </div>
                    )}
                  </div>
                  <TextField
                    label="Color"
                    name="color"
                    value={color.color}
                    onChange={(e) => handleColorChange(index, 'color', e.target.value)}
                    className="font-sans text-custom-bharat-dark"
                    InputLabelProps={{ className: 'font-sans text-custom-bharat-dark' }}
                    InputProps={{ className: 'font-sans text-custom-bharat-dark' }}
                  />
                  <TextField
                    label="Stock"
                    name="stock"
                    type="number"
                    inputProps={{ step: '1', min: '0' }}
                    value={color.stock}
                    onChange={(e) => handleColorChange(index, 'stock', e.target.value)}
                    className="font-sans text-custom-bharat-dark"
                    InputLabelProps={{ className: 'font-sans text-custom-bharat-dark' }}
                    InputProps={{ className: 'font-sans text-custom-bharat-dark' }}
                  />
                  <TextField
                    label="Minimum Stock"
                    name="minStock"
                    type="number"
                    inputProps={{ step: '1', min: '0' }}
                    value={color.minStock}
                    onChange={(e) => handleColorChange(index, 'minStock', e.target.value)}
                    className="font-sans text-custom-bharat-dark"
                    InputLabelProps={{ className: 'font-sans text-custom-bharat-dark' }}
                    InputProps={{ className: 'font-sans text-custom-bharat-dark' }}
                  />
                  <Button variant="outlined" onClick={() => handleRemoveColor(index)} className="font-sans" sx={{ color: 'custom.bharat-red', borderColor: 'custom.bharat-red', '&:hover': { borderColor: 'custom.bharat-red', backgroundColor: 'rgba(165, 42, 42, 0.1)' } }}>
                    Remove
                  </Button>
                </Box>
              ))}
              <Button variant="outlined" onClick={handleAddColor} startIcon={<AddIcon />} className="font-sans" sx={{ color: 'custom.bharat-dark', borderColor: 'custom.bharat-dark', '&:hover': { borderColor: 'custom.bharat-dark', backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                Add Color
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} className="font-sans" sx={{ color: 'custom.bharat-dark' }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" className="font-sans" sx={{ backgroundColor: 'custom.bharat-dark', color: 'custom.bharat-white', '&:hover': { backgroundColor: 'custom.bharat-dark' } }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteConfirm}
        onClose={handleCloseDeleteConfirm}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" className="text-custom-bharat-dark font-serif">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description" className="text-custom-bharat-dark font-sans">
            Are you sure you want to delete this sari?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} className="text-custom-bharat-dark font-sans">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus className="text-custom-bharat-red font-sans">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SariDetailsPage; 