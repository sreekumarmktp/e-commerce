import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Switch,
    FormControlLabel,
    Chip,
    IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
    fetchProductById,
    addProduct,
    updateProduct,
    toggleProductVariants,
    addProductSize,
    removeProductSize,
    addProductColor,
    removeProductColor
} from '../../store/slices/productSlice';
import {
    fetchProductImages,
    clearImages,
} from '../../store/slices/productImagesSlice';
import {
    selectProductImages,
    selectImageLoading,
    selectImageError,
} from '../../store/selectors/productImagesSelectors';
import { RootState, AppDispatch } from '../../store/store';
import ImageUploadZone from '../../components/ImageUploadZone';
import ImageGallery from '../../components/ImageGallery';

const AdminProductForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { selectedProduct, loading, error } = useSelector((state: RootState) => state.products);
    const productImages = useSelector((state: RootState) => selectProductImages(state));
    const imageLoading = useSelector((state: RootState) => selectImageLoading(state));
    const imageError = useSelector((state: RootState) => selectImageError(state));

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        sizes: '',
        colors: '',
    });


    // Variant management state
    const [sizesEnabled, setSizesEnabled] = useState(true);
    const [colorsEnabled, setColorsEnabled] = useState(true);
    const [sizes, setSizes] = useState<string[]>([]);
    const [colors, setColors] = useState<string[]>([]);
    const [newSize, setNewSize] = useState('');
    const [newColor, setNewColor] = useState('');
    const [variantError, setVariantError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditMode && id) {
            dispatch(fetchProductById(id));
            dispatch(fetchProductImages(id));
        } else {
            dispatch(clearImages());
        }
    }, [isEditMode, id, dispatch]);

    useEffect(() => {
        if (isEditMode && selectedProduct) {
            setFormData({
                name: selectedProduct.name,
                description: selectedProduct.description,
                price: selectedProduct.price.toString(),
                category: selectedProduct.category,
                stock: selectedProduct.stock.toString(),
                sizes: (selectedProduct.sizes || []).join(', '),
                colors: (selectedProduct.colors || []).join(', '),
            });
            // Set variant management state
            setSizesEnabled(selectedProduct.sizesEnabled ?? true);
            setColorsEnabled(selectedProduct.colorsEnabled ?? true);
            setSizes(selectedProduct.sizes || []);
            setColors(selectedProduct.colors || []);
        }
    }, [isEditMode, selectedProduct]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Variant management handlers
    const handleToggleSizes = async (enabled: boolean) => {
        setSizesEnabled(enabled);
        if (isEditMode && id) {
            try {
                await dispatch(toggleProductVariants({ id, settings: { sizesEnabled: enabled } })).unwrap();
                setVariantError(null);
            } catch (err: any) {
                setVariantError(err || 'Failed to toggle sizes');
                setSizesEnabled(!enabled); // Revert on error
            }
        }
    };

    const handleToggleColors = async (enabled: boolean) => {
        setColorsEnabled(enabled);
        if (isEditMode && id) {
            try {
                await dispatch(toggleProductVariants({ id, settings: { colorsEnabled: enabled } })).unwrap();
                setVariantError(null);
            } catch (err: any) {
                setVariantError(err || 'Failed to toggle colors');
                setColorsEnabled(!enabled); // Revert on error
            }
        }
    };

    const handleAddSize = async () => {
        if (!newSize.trim()) {
            setVariantError('Size value cannot be empty');
            return;
        }

        if (sizes.includes(newSize.trim())) {
            setVariantError('Size value already exists');
            return;
        }

        if (isEditMode && id) {
            try {
                await dispatch(addProductSize({ id, size: newSize.trim() })).unwrap();
                setNewSize('');
                setVariantError(null);
            } catch (err: any) {
                setVariantError(err || 'Failed to add size');
            }
        } else {
            // For new products, just update local state
            setSizes([...sizes, newSize.trim()]);
            setNewSize('');
            setVariantError(null);
        }
    };

    const handleRemoveSize = async (size: string) => {
        if (isEditMode && id) {
            try {
                await dispatch(removeProductSize({ id, size })).unwrap();
                setVariantError(null);
            } catch (err: any) {
                setVariantError(err || 'Failed to remove size');
            }
        } else {
            // For new products, just update local state
            setSizes(sizes.filter(s => s !== size));
        }
    };

    const handleAddColor = async () => {
        if (!newColor.trim()) {
            setVariantError('Color value cannot be empty');
            return;
        }

        if (colors.includes(newColor.trim())) {
            setVariantError('Color value already exists');
            return;
        }

        if (isEditMode && id) {
            try {
                await dispatch(addProductColor({ id, color: newColor.trim() })).unwrap();
                setNewColor('');
                setVariantError(null);
            } catch (err: any) {
                setVariantError(err || 'Failed to add color');
            }
        } else {
            // For new products, just update local state
            setColors([...colors, newColor.trim()]);
            setNewColor('');
            setVariantError(null);
        }
    };

    const handleRemoveColor = async (color: string) => {
        if (isEditMode && id) {
            try {
                await dispatch(removeProductColor({ id, color })).unwrap();
                setVariantError(null);
            } catch (err: any) {
                setVariantError(err || 'Failed to remove color');
            }
        } else {
            // For new products, just update local state
            setColors(colors.filter(c => c !== color));
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const productData = {
            ...formData,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            sizes: sizes,
            colors: colors,
            sizesEnabled: sizesEnabled,
            colorsEnabled: colorsEnabled,
            // primaryImagePath is the source of truth now
            primaryImagePath: selectedProduct?.primaryImagePath || selectedProduct?.image || '',
            image: selectedProduct?.image || '',
            images: productImages.map(img => img.imageUrl),
        };

        const finalData = {
            ...productData,
        };

        if (isEditMode && id) {
            await dispatch(updateProduct({ id, ...finalData }));
        } else {
            await dispatch(addProduct(finalData));
        }
        navigate('/admin/products');
    };

    return (
        <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
                {isEditMode ? 'Edit Product' : 'Add New Product'}
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {loading && isEditMode && <CircularProgress />}

            <Box component="form" onSubmit={handleSubmit} role="form">
                <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    margin="normal"
                    required
                />
                <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    margin="normal"
                    multiline
                    rows={3}
                />
                <TextField
                    fullWidth
                    label="Price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    margin="normal"
                    required
                />
                <TextField
                    fullWidth
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    margin="normal"
                />
                <TextField
                    fullWidth
                    label="Stock"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleChange}
                    margin="normal"
                    required
                />

                {/* Size Variant Management */}
                <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={sizesEnabled}
                                onChange={(e) => handleToggleSizes(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Enable Sizes"
                    />

                    {sizesEnabled && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Available Sizes
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, mb: 2 }}>
                                {sizes.map((size) => (
                                    <Chip
                                        key={size}
                                        label={size}
                                        onDelete={() => handleRemoveSize(size)}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                                {sizes.length === 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                        No sizes added yet
                                    </Typography>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    size="small"
                                    label="New Size"
                                    value={newSize}
                                    onChange={(e) => setNewSize(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSize();
                                        }
                                    }}
                                    placeholder="e.g., S, M, L, XL"
                                />
                                <IconButton
                                    color="primary"
                                    onClick={handleAddSize}
                                    aria-label="add size"
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Color Variant Management */}
                <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={colorsEnabled}
                                onChange={(e) => handleToggleColors(e.target.checked)}
                                color="secondary"
                            />
                        }
                        label="Enable Colors"
                    />

                    {colorsEnabled && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Available Colors
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, mb: 2 }}>
                                {colors.map((color) => (
                                    <Chip
                                        key={color}
                                        label={color}
                                        onDelete={() => handleRemoveColor(color)}
                                        color="secondary"
                                        variant="outlined"
                                    />
                                ))}
                                {colors.length === 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                        No colors added yet
                                    </Typography>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    size="small"
                                    label="New Color"
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddColor();
                                        }
                                    }}
                                    placeholder="e.g., Red, Blue, Green"
                                />
                                <IconButton
                                    color="secondary"
                                    onClick={handleAddColor}
                                    aria-label="add color"
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    )}
                </Box>

                {variantError && (
                    <Alert severity="error" sx={{ mt: 2 }} onClose={() => setVariantError(null)}>
                        {variantError}
                    </Alert>
                )}

                {/* Image Management Section - Only in Edit Mode */}
                {isEditMode && id && (
                    <Box sx={{ mt: 4, p: 3, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                            Image Management
                        </Typography>
                        {imageError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {imageError}
                            </Alert>
                        )}
                        <ImageUploadZone productId={id} />
                        <Box sx={{ mt: 3 }}>
                            <ImageGallery
                                images={productImages}
                                productId={id}
                                isLoading={imageLoading}
                            />
                        </Box>
                    </Box>
                )}



                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={loading}
                >
                    {isEditMode ? 'Update Product' : 'Create Product'}
                </Button>
            </Box>
        </Paper>
    );
};

export default AdminProductForm;
