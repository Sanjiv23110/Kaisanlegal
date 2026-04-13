import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Check, Zap } from 'lucide-react';

interface Plan {
  name: string;
  monthly_limit: number | null;
  price: number;
  features: string[];
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: number;
  onPaymentSuccess: (tier: string) => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onClose,
  planName,
  planPrice,
  onPaymentSuccess,
}) => {
  const [formData, setFormData] = useState({
    card_number: '',
    card_expiry: '',
    card_cvv: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('access_token');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'card_number') {
      setFormData(prev => ({
        ...prev,
        [name]: value.replace(/\D/g, '').slice(0, 16)
      }));
    } else if (name === 'card_expiry') {
      let val = value.replace(/\D/g, '');
      if (val.length >= 2) {
        val = val.slice(0, 2) + '/' + val.slice(2, 4);
      }
      setFormData(prev => ({
        ...prev,
        [name]: val
      }));
    } else if (name === 'card_cvv') {
      setFormData(prev => ({
        ...prev,
        [name]: value.replace(/\D/g, '').slice(0, 4)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_name: planName,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Payment failed');
        return;
      }

      onPaymentSuccess(planName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Complete Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-slate-50 rounded">
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="text-lg font-semibold capitalize">{planName}</p>
            <p className="text-sm text-muted-foreground mt-2">Amount</p>
            <p className="text-2xl font-bold">
              {planPrice === 0 ? 'FREE' : `$${planPrice.toFixed(2)}`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Card Number</label>
              <input
                type="text"
                name="card_number"
                placeholder="1234 5678 9012 3456"
                value={formData.card_number.replace(/(\d{4})/g, '$1 ').trim()}
                onChange={handleInputChange}
                maxLength={19}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Expiry (MM/YY)</label>
                <input
                  type="text"
                  name="card_expiry"
                  placeholder="12/25"
                  value={formData.card_expiry}
                  onChange={handleInputChange}
                  maxLength={5}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CVV</label>
                <input
                  type="text"
                  name="card_cvv"
                  placeholder="123"
                  value={formData.card_cvv}
                  onChange={handleInputChange}
                  maxLength={4}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-800 text-sm rounded">
                {error}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              This is a simulated payment. No actual charges will be made. Use any valid format for testing.
            </p>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function PricingCards() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plans
        const plansResponse = await fetch('http://localhost:8000/api/subscription/plans');
        const plansData = await plansResponse.json();
        setPlans(plansData);

        // Fetch user tier
        if (token) {
          const tierResponse = await fetch('http://localhost:8000/api/user/tier', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const tierData = await tierResponse.json();
          setCurrentTier(tierData.tier);
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleUpgradeClick = (plan: Plan) => {
    if (currentTier === plan.name) return;
    setSelectedPlan(plan);
    setPaymentOpen(true);
  };

  const handlePaymentSuccess = (tierName: string) => {
    setCurrentTier(tierName);
  };

  if (loading) {
    return <div className="text-center py-12">Loading pricing plans...</div>;
  }

  return (
    <>
      <div className="py-12 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground">
              Select the perfect plan for your legal document needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-lg border-2 transition-all ${
                  currentTier === plan.name
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {currentTier === plan.name && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
                    Current Plan
                  </div>
                )}

                <CardHeader className="pb-0">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <CardTitle className="capitalize text-2xl">{plan.name}</CardTitle>
                      {plan.name === 'premium' && (
                        <div className="flex items-center gap-1 mt-2 text-amber-600">
                          <Zap className="w-4 h-4" />
                          <span className="text-sm font-medium">Most Popular</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      {plan.price === 0 ? 'FREE' : `$${plan.price.toFixed(2)}`}
                    </span>
                    {plan.price > 0 && <span className="text-muted-foreground ml-2">/month</span>}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4 mb-8">
                    <div className="text-sm text-muted-foreground">
                      {plan.monthly_limit ? (
                        <p className="font-semibold text-slate-900">
                          Up to {plan.monthly_limit} document uploads per month
                        </p>
                      ) : (
                        <p className="font-semibold text-slate-900">
                          Unlimited document uploads per month
                        </p>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold mb-3">Features included:</p>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleUpgradeClick(plan)}
                    disabled={currentTier === plan.name}
                    variant={currentTier === plan.name ? 'outline' : 'default'}
                    className="w-full"
                  >
                    {currentTier === plan.name
                      ? 'Current Plan'
                      : plan.name === 'premium'
                        ? 'Upgrade to Premium'
                        : 'Switch to Free'}
                  </Button>
                </CardContent>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedPlan && (
        <PaymentDialog
          isOpen={paymentOpen}
          onClose={() => {
            setPaymentOpen(false);
            setSelectedPlan(null);
          }}
          planName={selectedPlan.name}
          planPrice={selectedPlan.price}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
