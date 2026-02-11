import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    Paper,
    Grid,
    TextField,
    Divider,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
} from '@mui/material';
import { RootState, AppDispatch } from '../store/store';
import { clearCart } from '../store/slices/cartSlice';
import { createOrder, OrderItem } from '../services/orderService';

const steps = ['Shipping Address', 'Payment Details', 'Review Order'];

const Checkout: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { cart } = useSelector((state: RootState) => state.cart);
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const [shippingData, setShippingData] = useState({
        firstName: '',
        lastName: '',
        address1: '',
        city: '',
        state: '',
        zip: '',
        country: '',
    });

    const [paymentData, setPaymentData] = useState({
        cardName: '',
        cardNumber: '',
        expDate: '',
        cvv: '',
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: { pathname: '/checkout' } } });
        }
        if (!cart || cart.items.length === 0) {
            navigate('/cart');
        }
    }, [isAuthenticated, cart, navigate]);

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShippingData({ ...shippingData, [e.target.name]: e.target.value });
    };

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
    };

    const handlePlaceOrder = async () => {
        if (!cart) return;
        setLoading(true);
        setError(null);
        try {
            const orderItems: OrderItem[] = cart.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }));
            await createOrder(orderItems);
            dispatch(clearCart());
            setActiveStep(steps.length);
        } catch (err: any) {
            setError(err.message || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    const renderShippingForm = () => (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    required
                    name="firstName"
                    label="First name"
                    fullWidth
                    autoComplete="given-name"
                    variant="standard"
                    value={shippingData.firstName}
                    onChange={handleShippingChange}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    required
                    name="lastName"
                    label="Last name"
                    fullWidth
                    autoComplete="family-name"
                    variant="standard"
                    value={shippingData.lastName}
                    onChange={handleShippingChange}
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                    required
                    name="address1"
                    label="Address line 1"
                    fullWidth
                    autoComplete="shipping address-line1"
                    variant="standard"
                    value={shippingData.address1}
                    onChange={handleShippingChange}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    required
                    name="city"
                    label="City"
                    fullWidth
                    autoComplete="shipping address-level2"
                    variant="standard"
                    value={shippingData.city}
                    onChange={handleShippingChange}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    name="state"
                    label="State/Province/Region"
                    fullWidth
                    variant="standard"
                    value={shippingData.state}
                    onChange={handleShippingChange}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    required
                    name="zip"
                    label="Zip / Postal code"
                    fullWidth
                    autoComplete="shipping postal-code"
                    variant="standard"
                    value={shippingData.zip}
                    onChange={handleShippingChange}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    required
                    name="country"
                    label="Country"
                    fullWidth
                    autoComplete="shipping country"
                    variant="standard"
                    value={shippingData.country}
                    onChange={handleShippingChange}
                />
            </Grid>
        </Grid>
    );

    const renderPaymentForm = () => (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    name="cardName"
                    label="Name on card"
                    fullWidth
                    autoComplete="cc-name"
                    variant="standard"
                    value={paymentData.cardName}
                    onChange={handlePaymentChange}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    name="cardNumber"
                    label="Card number"
                    fullWidth
                    autoComplete="cc-number"
                    variant="standard"
                    value={paymentData.cardNumber}
                    onChange={handlePaymentChange}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    name="expDate"
                    label="Expiry date"
                    fullWidth
                    autoComplete="cc-exp"
                    variant="standard"
                    value={paymentData.expDate}
                    onChange={handlePaymentChange}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    required
                    name="cvv"
                    label="CVV"
                    helperText="Last three digits on signature strip"
                    fullWidth
                    autoComplete="cc-csc"
                    variant="standard"
                    value={paymentData.cvv}
                    onChange={handlePaymentChange}
                />
            </Grid>
        </Grid>
    );

    const renderReview = () => (
        <React.Fragment>
            <Typography variant="h6" gutterBottom>
                Order summary
            </Typography>
            <List disablePadding>
                {cart?.items.map((product) => (
                    <ListItem key={product.id} sx={{ py: 1, px: 0 }}>
                        <ListItemText primary={product.productName} secondary={`Qty: ${product.quantity}`} />
                        <Typography variant="body2">₹{product.totalPrice.toFixed(2)}</Typography>
                    </ListItem>
                ))}
                <ListItem sx={{ py: 1, px: 0 }}>
                    <ListItemText primary="Total" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        ₹{cart?.totalAmount.toFixed(2)}
                    </Typography>
                </ListItem>
            </List>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Shipping
                    </Typography>
                    <Typography gutterBottom>{shippingData.firstName} {shippingData.lastName}</Typography>
                    <Typography gutterBottom>{shippingData.address1}, {shippingData.city}, {shippingData.zip}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Payment details
                    </Typography>
                    <Grid container>
                        <Grid size={{ xs: 6 }}>
                            <Typography gutterBottom>Card type</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Typography gutterBottom>Visa</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Typography gutterBottom>Card holder</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Typography gutterBottom>{paymentData.cardName}</Typography>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </React.Fragment>
    );

    const getStepContent = (step: number) => {
        switch (step) {
            case 0:
                return renderShippingForm();
            case 1:
                return renderPaymentForm();
            case 2:
                return renderReview();
            default:
                throw new Error('Unknown step');
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
                <Typography component="h1" variant="h4" align="center">
                    Checkout
                </Typography>
                <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                {activeStep === steps.length ? (
                    <React.Fragment>
                        <Typography variant="h5" gutterBottom>
                            Thank you for your order.
                        </Typography>
                        <Typography variant="subtitle1">
                            Your order has been placed successfully. We will send you an email confirmation shortly.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/')}
                            sx={{ mt: 3 }}
                        >
                            Back to Store
                        </Button>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {getStepContent(activeStep)}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {activeStep !== 0 && (
                                <Button onClick={handleBack} sx={{ mt: 3, ml: 1 }}>
                                    Back
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                onClick={activeStep === steps.length - 1 ? handlePlaceOrder : handleNext}
                                sx={{ mt: 3, ml: 1 }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : (activeStep === steps.length - 1 ? 'Place order' : 'Next')}
                            </Button>
                        </Box>
                    </React.Fragment>
                )}
            </Paper>
        </Box>
    );
};

export default Checkout;
