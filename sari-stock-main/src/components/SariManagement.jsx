import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  InputAdornment,
  Button,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, Storefront as StorefrontIcon } from '@mui/icons-material';
import { addHistoryEntry } from '../utils/sariDB';
import DialogContentText from '@mui/material/DialogContentText';
import { useAlert } from '../context/AlertContext';

const SariManagement = () => {
  const { addAlert } = useAlert();
  const [saris, setSaris] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSari, setSelectedSari] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [sariToDelete, setSariToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sariNumber: '',
    price: '',
    imageUrl: 'https://i.pinimg.com/736x/ff/c8/d7/ffc8d7f63cbbcb11078ba33cc7a584b0.jpg',
    colors: [{ color: '', stock: '', minStock: '', colorImageUrl: '' }],
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    sariNumber: '',
    price: '',
    colors: [{ color: '', stock: '', minStock: '' }],
  });
  const [hasErrors, setHasErrors] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSaris = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/saris');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSaris(data);
      } catch (error) {
        console.error('Error fetching saris:', error);
        addAlert('Failed to fetch saris: ' + error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSaris();
  }, [addAlert]);

  const handleMainImageUpload = (file) => {
    if (!file) {
      setFormData(prev => ({
        ...prev,
        imageUrl: ''
      }));
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageUrl: reader.result
        }));
      };
      reader.onerror = () => {
        addAlert('Failed to read image file', 'error');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      addAlert('Error uploading image: ' + error.message, 'error');
    }
  };

  const handleRemoveMainImage = () => {
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({
      ...prev,
      [name]: ''
    }));
    setHasErrors(false);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColorChange = (index, field, value) => {
    const newColors = [...formData.colors];
    newColors[index] = {
      ...newColors[index],
      [field]: value,
    };
    setFormData({ ...formData, colors: newColors });
    setFormErrors(prev => {
      const newColorErrors = [...prev.colors];
      newColorErrors[index] = {
        ...newColorErrors[index],
        [field]: ''
      };
      setHasErrors(false);
      return { ...prev, colors: newColorErrors };
    });
  };

  const handleColorImageUpload = (index, file) => {
    if (!file) {
      const newColors = [...formData.colors];
      newColors[index] = {
        ...newColors[index],
        colorImageUrl: '',
      };
      setFormData({ ...formData, colors: newColors });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newColors = [...formData.colors];
        newColors[index] = {
          ...newColors[index],
          colorImageUrl: reader.result,
        };
        setFormData({ ...formData, colors: newColors });
      };
      reader.onerror = () => {
        addAlert('Failed to read image file', 'error');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading color image:', error);
      addAlert('Error uploading image: ' + error.message, 'error');
    }
  };

  const handleSubmit = async () => {
    // Reset errors before validation
    setFormErrors({
      name: '',
      sariNumber: '',
      price: '',
      colors: formData.colors.map(() => ({ color: '', stock: '', minStock: '' }))
    });

    setHasErrors(false); // Assume no errors initially
    let currentHasErrors = false; // Use a local flag for the current validation pass

    const newErrors = {
      name: '',
      sariNumber: '',
      price: '',
      colors: formData.colors.map(() => ({ color: '', stock: '', minStock: '' }))
    };

    if (!formData.name) {
      newErrors.name = 'Sari Name is required';
      currentHasErrors = true;
    }
    if (!formData.sariNumber) {
      newErrors.sariNumber = 'Sari Number is required';
      currentHasErrors = true;
    }
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be a valid positive number';
      currentHasErrors = true;
    } else if (formData.price === '') {
      newErrors.price = 'Price is required';
      currentHasErrors = true;
    }

    formData.colors.forEach((color, index) => {
      if (!color.color) {
        newErrors.colors[index].color = 'Color is required';
        currentHasErrors = true;
      }
      if (color.stock === '' || isNaN(parseInt(color.stock)) || parseInt(color.stock) < 0) {
        newErrors.colors[index].stock = 'Valid stock is required';
        currentHasErrors = true;
      }
      if (color.minStock === '' || isNaN(parseInt(color.minStock)) || parseInt(color.minStock) < 0) {
        newErrors.colors[index].minStock = 'Valid minimum stock is required';
        currentHasErrors = true;
      }
    });

    setFormErrors(newErrors);
    setHasErrors(currentHasErrors);

    if (currentHasErrors) {
      addAlert('Please fix the errors in the form', 'error');
      return;
    }

    const sariData = {
      name: formData.name,
      sariNumber: formData.sariNumber,
      price: parseFloat(formData.price),
      imageUrl: formData.imageUrl,
      colors: formData.colors.map((c) => ({
        color: c.color,
        stock: parseInt(c.stock),
        minStock: parseInt(c.minStock),
        colorImageUrl: c.colorImageUrl,
      })),
    };

    const maxRetries = 5;
    let retries = 0;
    const retryDelay = 500;

    setIsSubmitting(true);

    try {
    while (retries < maxRetries) {
      try {
        let response;
        let savedSariBackend;
          let historyEntry = null;

        if (selectedSari) {
          console.log(`Attempting to update sari ${selectedSari._id}, Retry ${retries + 1}`);
          response = await fetch(`http://localhost:5000/api/saris/update/${selectedSari._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sariData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 409 && errorData.error?.includes('VersionError')) {
              console.warn('VersionError detected, refetching and retrying...');
              retries++;
              if (retries < maxRetries) {
                const latestSariResponse = await fetch(`http://localhost:5000/api/saris/${selectedSari._id}`);
                if (!latestSariResponse.ok) {
                  throw new Error(`Failed to refetch sari ${selectedSari._id}`);
                }
                const latestSariData = await latestSariResponse.json();
                setFormData({
                  name: latestSariData.name,
                  sariNumber: latestSariData.sariNumber,
                  price: latestSariData.price?.toString() ?? '',
                  imageUrl: latestSariData.imageUrl ?? '',
                  colors: latestSariData.colors.map((c) => ({
                    color: c.color,
                    stock: c.stock?.toString() ?? '0',
                    minStock: c.minStock?.toString() ?? '0',
                    colorImageUrl: c.colorImageUrl ?? '',
                  })),
                });
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
                continue;
              }
              throw new Error('VersionError: Max retries reached');
            }
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          savedSariBackend = await response.json();
          setSaris(saris.map((s) => (s._id === selectedSari._id ? savedSariBackend : s)));

            // History logging for updates - only log stock/minStock changes
            const oldColors = selectedSari.colors || [];
            const newColors = savedSariBackend.colors || [];
            const colorChanges = [];

            newColors.forEach((newColor) => {
                const oldColor = oldColors.find((oc) => oc.color === newColor.color);
                if (oldColor) {
                    // Only log if stock or minStock changed
                    if (oldColor.stock !== newColor.stock || oldColor.minStock !== newColor.minStock) {
                        colorChanges.push({ 
                            color: newColor.color, 
                            oldStock: oldColor.stock, 
                            newStock: newColor.stock, 
                            oldMinStock: oldColor.minStock, 
                            newMinStock: newColor.minStock 
                        });
                    }
                }
            });

            if (colorChanges.length > 0) {
                historyEntry = {
                    id: Date.now(),
                    sariId: savedSariBackend._id,
                    action: 'stock_update',
                    sari: {
                        _id: savedSariBackend._id,
                        sariNumber: savedSariBackend.sariNumber,
                        name: savedSariBackend.name,
                    },
                    changes: colorChanges,
                    timestamp: new Date().toISOString(),
                };
            }

        } else {
          console.log('Attempting to add new sari');
          response = await fetch('http://localhost:5000/api/saris/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sariData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          savedSariBackend = await response.json();
          setSaris([...saris, savedSariBackend]);

            // History logging for new sari - only log initial stock levels
            const initialColors = savedSariBackend.colors || [];
            const initialChanges = initialColors
                .filter(c => c.stock > 0 || c.minStock > 0)
                .map(c => ({
                    color: c.color,
                    oldStock: 0,
                    newStock: c.stock,
                    oldMinStock: 0,
                    newMinStock: c.minStock
                }));

            if (initialChanges.length > 0) {
                historyEntry = {
          id: Date.now(),
          sariId: savedSariBackend._id,
                    action: 'stock_update',
                    sari: {
            _id: savedSariBackend._id,
            sariNumber: savedSariBackend.sariNumber,
            name: savedSariBackend.name,
          },
                    changes: initialChanges,
          timestamp: new Date().toISOString(),
        };
            }
          }

          // Add history entry if one was created
          if (historyEntry) {
             await addHistoryEntry(historyEntry);
          }

          addAlert(selectedSari ? 'Sari updated successfully!' : 'Sari added successfully!', 'success');
        handleCloseDialog();
          break; // Exit loop on success
      } catch (error) {
        console.error('Error saving sari:', error);
        if (error.message.includes('VersionError') && retries < maxRetries - 1) {
            continue; // Continue loop for VersionError
          }
          addAlert('Failed to save sari: ' + error.message, 'error');
          break; // Exit loop on other errors
        }
      }
    } finally {
      setIsSubmitting(false); // End submitting outside the loop
    }
  };

  const handleEdit = async (sari) => {
    console.log('handleEdit called with sari:', sari);
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/saris/${sari._id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sari ${sari._id}`);
      }
      const latestSariData = await response.json();
      console.log('handleEdit - fetched latest sari:', latestSariData);
      setSelectedSari(latestSariData);
      setFormData({
        name: latestSariData.name,
        sariNumber: latestSariData.sariNumber,
        price: latestSariData.price?.toString() ?? '',
        imageUrl: latestSariData.imageUrl ?? '',
        colors: latestSariData.colors.map((c) => ({
          color: c.color,
          stock: c.stock?.toString() ?? '0',
          minStock: c.minStock?.toString() ?? '0',
          colorImageUrl: c.colorImageUrl ?? '',
        })),
      });
      // Also reset errors when opening the dialog for edit
      setFormErrors({
        name: '',
        sariNumber: '',
        price: '',
        colors: latestSariData.colors.map(() => ({ color: '', stock: '', minStock: '' }))
      });
      setHasErrors(false);
      setOpenDialog(true);
    } catch (error) {
      console.error('Error fetching sari:', error);
      addAlert('Failed to fetch sari: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setSariToDelete(id);
    setOpenDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm(false);
    setSariToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!sariToDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/saris/${sariToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const deletedSari = saris.find((s) => s._id === sariToDelete);
      const historyEntry = {
        id: Date.now(),
        sariId: sariToDelete,
        action: 'delete',
        oldData: deletedSari
          ? {
              _id: sariToDelete,
              sariNumber: deletedSari.sariNumber,
              name: deletedSari.name,
            }
          : null,
        newData: null,
        timestamp: new Date().toISOString(),
      };
      await addHistoryEntry(historyEntry);

      setSaris(saris.filter((s) => s._id !== sariToDelete));
      addAlert('Sari deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting sari:', error);
      addAlert('Failed to delete sari: ' + error.message, 'error');
    } finally {
      setLoading(false);
      handleCloseDeleteConfirm();
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSari(null);
    setFormData({
      name: '',
      sariNumber: '',
      price: '',
      imageUrl: 'https://i.pinimg.com/736x/ff/c8/d7/ffc8d7f63cbbcb11078ba33cc7a584b0.jpg',
      colors: [{ color: '', stock: '', minStock: '', colorImageUrl: '' }],
    });
    // Also reset errors when closing the dialog
    setFormErrors({
      name: '',
      sariNumber: '',
      price: '',
      colors: [{ color: '', stock: '', minStock: '' }],
    });
    setHasErrors(false);
  };

  const handleAddColor = () => {
    setFormData({
      ...formData,
      colors: [...formData.colors, { color: '', stock: '', minStock: '', colorImageUrl: '' }],
    });
    setFormErrors(prev => ({
      ...prev,
      colors: [...prev.colors, { color: '', stock: '', minStock: '' }]
    }));
    // When adding a new color row, we should re-evaluate the overall form validity
    // as the new row might be invalid by default.
    let currentHasErrors = !!formErrors.name || !!formErrors.sariNumber || !!formErrors.price;
    formData.colors.forEach((color, index) => {
        if (!color.color || color.stock === '' || isNaN(parseInt(color.stock)) || parseInt(color.stock) < 0 || color.minStock === '' || isNaN(parseInt(color.minStock)) || parseInt(color.minStock) < 0) {
            currentHasErrors = true;
        }
    });
     // Add the new empty color error state to the check
    // This validation logic for the new empty row seems incorrect
    // if (!'' || '' === '' || isNaN(parseInt('')) || parseInt('') < 0 || '' === '' || isNaN(parseInt('')) || parseInt('') < 0) { // This validation logic for the new empty row seems incorrect
        // currentHasErrors = true; // We should not mark as error just because a new empty row is added
    // }
    setHasErrors(currentHasErrors);
  };

  const handleRemoveColor = (index) => {
    const newColors = formData.colors.filter((_, i) => i !== index);
    const newColorErrors = formErrors.colors.filter((_, i) => i !== index);
    setFormData({ ...formData, colors: newColors });
    setFormErrors({ ...formErrors, colors: newColorErrors });
    // Re-evaluate hasErrors after removing a color
    const currentHasErrors = newColorErrors.some(colorError => Object.values(colorError).some(error => !!error)) ||
                             !!formErrors.name || !!formErrors.sariNumber || !!formErrors.price;
    setHasErrors(currentHasErrors);
  };

  const filteredSaris = saris.filter((sari) =>
    sari.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sari.sariNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-custom-bharat-dark font-serif">Sari Inventory</h1>
        <button
          onClick={() => {
            setSelectedSari(null);
            setFormData({
              name: '',
              sariNumber: '',
              price: '',
              imageUrl: 'https://i.pinimg.com/736x/ff/c8/d7/ffc8d7f63cbbcb11078ba33cc7a584b0.jpg',
              colors: [{ color: '', stock: '', minStock: '', colorImageUrl: '' }],
            });
            setOpenDialog(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-custom-bharat-dark text-custom-bharat-white rounded-md hover:bg-gray-700 transition-colors duration-200"
        >
          <AddIcon className="mr-2" />
          Add New Sari
        </button>
      </div>

      <div className="relative">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search saris..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white rounded-lg shadow-sm"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon className="text-gray-400" />
              </InputAdornment>
            ),
          }}
        />
      </div>

            {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
            ) : filteredSaris.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg">
          <StorefrontIcon className="h-24 w-24 text-gray-400 mb-4" />
          <p className="text-custom-bharat-dark text-xl font-semibold font-serif">No saris found</p>
          <p className="text-gray-500 mt-2 font-sans">Try adjusting your search or add new saris.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSaris.map((sari) => (
            <div
                  key={sari._id}
              className="relative rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/sari/${sari._id}`)}
            >
              {sari.imageUrl && (
                <div className="w-full aspect-w-16 aspect-h-10">
                  <img
                    src={sari.imageUrl}
                    alt={sari.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-white">
                      <h3 className="text-xl font-semibold truncate font-serif">{sari.name}</h3>
                      <p className="text-sm font-sans">Sari #: {sari.sariNumber}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-4 space-y-2 bg-custom-bharat-white">
                <p className="text-custom-bharat-dark font-bold text-lg font-sans">₹{sari.price}</p>
                <div className="flex flex-wrap gap-1">
                  {sari.colors.map((color, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-custom-bharat-light-gray text-custom-bharat-dark rounded-full text-xs font-medium font-sans"
                    >
                      {color.color} ({color.stock})
                    </span>
                  ))}
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(sari);
                      }}
                    className="p-2 text-custom-bharat-dark hover:bg-gray-200 rounded-full transition-colors duration-200"
                  >
                    <EditIcon fontSize="small" />
                  </button>
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(sari._id);
                      }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                  >
                    <DeleteIcon fontSize="small" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle className="text-custom-bharat-dark font-serif">{selectedSari ? 'Edit Sari Details' : 'Add New Sari'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Sari Number"
                  name="sariNumber"
                  value={formData.sariNumber}
                  onChange={handleInputChange}
                  required
                  error={!!formErrors.sariNumber}
                  helperText={formErrors.sariNumber}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Sari Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-custom-bharat-dark font-sans">
                      Main Sari Image
                    </label>
                    <input
                      accept="image/*"
                      type="file"
                      onChange={(e) => handleMainImageUpload(e.target.files[0])}
                      className="block w-full text-sm text-custom-bharat-dark
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold file:font-sans
                        file:bg-custom-bharat-gold file:text-custom-bharat-dark
                        hover:file:bg-yellow-700"
                    />
                  </div>
                  {formData.imageUrl && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-custom-bharat-dark font-sans">Image Preview:</p>
                      <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={formData.imageUrl}
                          alt="Sari Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={handleRemoveMainImage}
                        className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-md hover:bg-red-100 transition-colors duration-200 font-sans"
                      >
                        Remove Image
                      </button>
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
                  required
                  inputProps={{ min: '0', step: '0.01' }}
                  error={!!formErrors.price}
                  helperText={formErrors.price}
                />
              </Grid>
              <Grid item xs={12}>
                <h3 className="text-lg font-semibold mb-4 text-custom-bharat-dark font-serif">Colors & Stock</h3>
                {formData.colors.map((color, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {color.colorImageUrl && (
                      <div className="relative w-32 h-32">
                      <img
                        src={color.colorImageUrl}
                        alt="Color Preview"
                          className="w-full h-full object-cover rounded-md"
                      />
                      </div>
                    )}
                    <TextField
                      label="Color"
                      name="color"
                      value={color.color}
                      onChange={(e) => handleColorChange(index, 'color', e.target.value)}
                      required
                      error={!!formErrors.colors[index]?.color}
                      helperText={formErrors.colors[index]?.color}
                    />
                    <TextField
                      label="Stock"
                      name="stock"
                      type="number"
                      inputProps={{ step: '1', min: '0' }}
                      value={color.stock}
                      onChange={(e) => handleColorChange(index, 'stock', e.target.value)}
                      required
                      error={!!formErrors.colors[index]?.stock}
                      helperText={formErrors.colors[index]?.stock}
                    />
                    <TextField
                      label="Minimum Stock"
                      name="minStock"
                      type="number"
                      inputProps={{ step: '1', min: '0' }}
                      value={color.minStock}
                      onChange={(e) => handleColorChange(index, 'minStock', e.target.value)}
                      required
                      error={!!formErrors.colors[index]?.minStock}
                      helperText={formErrors.colors[index]?.minStock}
                    />
                    <div className="flex flex-col items-center gap-2">
                    <input
                      accept="image/*"
                      type="file"
                      onChange={(e) => handleColorImageUpload(index, e.target.files[0])}
                        className="block w-full text-sm text-custom-bharat-dark font-sans
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold file:font-sans
                          file:bg-custom-bharat-gold file:text-custom-bharat-dark
                          hover:file:bg-yellow-700"
                    />
                    {index > 0 && (
                        <Button 
                          color="error" 
                          onClick={() => handleRemoveColor(index)}
                          className="mt-2 font-sans"
                        >
                        Remove Color
                      </Button>
                    )}
                    </div>
                  </Box>
                ))}
                <Button 
                  variant="outlined" 
                  onClick={handleAddColor} 
                  startIcon={<AddIcon />}
                  className="mt-4 text-custom-bharat-dark border-custom-bharat-dark hover:bg-gray-200 font-sans"
                >
                  Add Color
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting} className="font-sans">Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={
              loading ||
              isSubmitting ||
              hasErrors
            }
            className="font-sans"
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (selectedSari ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteConfirm}
        onClose={handleCloseDeleteConfirm}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" className="text-custom-bharat-dark font-serif">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description" className="font-sans">
            Are you sure you want to delete this sari?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} className="font-sans">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus disabled={loading} className="font-sans">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SariManagement;