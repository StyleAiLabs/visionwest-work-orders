import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppHeader from '../../components/layout/AppHeader';
import MobileNavigation from '../../components/layout/MobileNavigation';
import QuoteProvisionForm from '../../components/Quotes/QuoteProvisionForm';
import QuoteAttachments from '../../components/QuoteAttachments';
import QuoteMessages from '../../components/QuoteMessages';
import { quoteService } from '../../services/quoteService';
import { toast } from 'react-toastify';

const QuoteDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProvisionForm, setShowProvisionForm] = useState(false);

    const isStaff = user?.role === 'staff' || user?.role === 'admin';
    const isClientAdmin = user?.role === 'client_admin' || user?.role === 'admin';
    const canProvideQuote = isStaff && (quote?.status === 'Submitted' || quote?.status === 'Information Requested');
    const canApproveQuote = isClientAdmin && quote?.status === 'Quoted';
    const canConvertToWorkOrder = isStaff && quote?.status === 'Approved';

    // T077, T085: Check if quote is expired
    const isExpired = quote?.quote_valid_until && new Date(quote.quote_valid_until) < new Date();

    // T099: State for conversion dialog
    const [showConvertDialog, setShowConvertDialog] = useState(false);
    const [converting, setConverting] = useState(false);
    const [convertFormData, setConvertFormData] = useState({
        supplier_name: 'Williams Property Service',
        schedule_date: new Date().toISOString().split('T')[0],
        po_number: ''
    });

    // T115-T116: State for request info dialog
    const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
    const [requestingInfo, setRequestingInfo] = useState(false);
    const [infoRequestMessage, setInfoRequestMessage] = useState('');
    const canRequestInfo = isStaff && quote?.status === 'Submitted';

    useEffect(() => {
        loadQuote();
    }, [id]);

    const loadQuote = async () => {
        try {
            setLoading(true);
            const response = await quoteService.getQuoteById(id);
            if (response.success) {
                setQuote(response.data);
            }
        } catch (error) {
            console.error('Error loading quote:', error);
            toast.error('Failed to load quote details');
        } finally {
            setLoading(false);
        }
    };

    const handleQuoteProvided = () => {
        setShowProvisionForm(false);
        loadQuote(); // Reload quote to show updated status
        toast.success('Quote provided successfully!');
    };

    // T083, T086: Handle quote approval with confirmation
    const handleApproveQuote = async () => {
        // T084: Confirmation dialog
        const confirmed = window.confirm(
            'Approval means commitment to proceed with this work. Are you sure you want to approve this quote?'
        );

        if (!confirmed) return;

        try {
            setLoading(true);
            const response = await quoteService.approveQuote(quote.id);
            if (response.success) {
                toast.success('Quote approved successfully!');
                loadQuote(); // Reload to show updated status
            }
        } catch (error) {
            console.error('Error approving quote:', error);
            // Error toast already shown by service
        } finally {
            setLoading(false);
        }
    };

    // T099-T102: Handle quote conversion to work order
    const handleConvertToWorkOrder = async () => {
        try {
            setConverting(true);
            const response = await quoteService.convertToWorkOrder(quote.id, convertFormData);

            if (response.success) {
                // T102: Navigate to work order detail page
                const workOrderId = response.data.workOrder.id;
                toast.success(`Quote converted to Work Order ${response.data.workOrder.job_no}!`);
                navigate(`/work-orders/${workOrderId}`);
            }
        } catch (error) {
            console.error('Error converting quote:', error);
            // Error toast already shown by service
        } finally {
            setConverting(false);
            setShowConvertDialog(false);
        }
    };

    const handleConvertFormChange = (e) => {
        const { name, value } = e.target;
        setConvertFormData({
            ...convertFormData,
            [name]: value
        });
    };

    // T115-T116: Handle request more info
    const handleRequestInfo = async () => {
        if (!infoRequestMessage.trim()) {
            toast.warning('Please enter a message explaining what information is needed');
            return;
        }

        try {
            setRequestingInfo(true);
            await quoteService.requestInfo(quote.id, infoRequestMessage.trim());
            setShowRequestInfoDialog(false);
            setInfoRequestMessage('');
            await loadQuote(); // Reload to show updated status
        } catch (error) {
            console.error('Error requesting information:', error);
            // Error toast already shown by service
        } finally {
            setRequestingInfo(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Draft': 'bg-gray-100 text-gray-800',
            'Submitted': 'bg-blue-100 text-blue-800',
            'Information Requested': 'bg-yellow-100 text-yellow-800',
            'Quoted': 'bg-green-100 text-green-800',
            'Under Discussion': 'bg-amber-100 text-amber-800',
            'Approved': 'bg-emerald-100 text-emerald-800',
            'Declined': 'bg-red-100 text-red-800',
            'Expired': 'bg-red-200 text-red-900',
            'Converted': 'bg-nextgen-green bg-opacity-20 text-nextgen-green'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <AppHeader title="Quote Details" />
                <div className="pt-16 pb-20 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nextgen-green"></div>
                </div>
                <MobileNavigation />
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="min-h-screen bg-gray-50">
                <AppHeader title="Quote Details" />
                <div className="pt-16 pb-20 px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <p className="text-gray-600">Quote not found</p>
                        <button
                            onClick={() => navigate('/quotes')}
                            className="mt-4 text-nextgen-green hover:text-nextgen-green-dark"
                        >
                            Back to Quotes
                        </button>
                    </div>
                </div>
                <MobileNavigation />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AppHeader title="Quote Details" />

            <main className="pt-16 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{quote.quote_number || 'Draft'}</h1>
                                <p className="text-gray-600">{quote.title}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quote.status)}`}>
                                    {quote.status}
                                </span>
                                {quote.is_urgent && (
                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                                        URGENT
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Provide Quote Button - Staff Only */}
                        {canProvideQuote && !showProvisionForm && (
                            <button
                                onClick={() => setShowProvisionForm(true)}
                                className="w-full bg-nextgen-green hover:bg-nextgen-green-dark text-white px-4 py-3 rounded-lg font-medium transition-colors"
                            >
                                Provide Quote
                            </button>
                        )}

                        {/* T115: Request More Info Button - Staff Only on Submitted quotes */}
                        {canRequestInfo && (
                            <button
                                onClick={() => setShowRequestInfoDialog(true)}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-medium transition-colors mt-3"
                            >
                                Request More Information
                            </button>
                        )}

                        {/* T082, T072: Approve/Decline Buttons - Client Admin Only on Quoted status */}
                        {canApproveQuote && (
                            <div className="space-y-3">
                                {/* T085: Expiry Warning */}
                                {isExpired && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                        <p className="text-red-800 font-semibold">Quote Expired</p>
                                        <p className="text-red-600 text-sm">
                                            This quote expired on {new Date(quote.quote_valid_until).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleApproveQuote}
                                        disabled={isExpired || loading}
                                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                                            isExpired || loading
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-nextgen-green hover:bg-nextgen-green-dark text-white'
                                        }`}
                                    >
                                        {loading ? 'Approving...' : 'Approve Quote'}
                                    </button>
                                    <button
                                        onClick={() => toast.info('Decline functionality coming soon')}
                                        disabled={loading}
                                        className="flex-1 px-4 py-3 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50"
                                    >
                                        Decline Quote
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* T099: Convert to Work Order Button - Staff Only on Approved status */}
                        {canConvertToWorkOrder && (
                            <div className="space-y-3">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                    <p className="text-green-800 font-semibold">Quote Approved</p>
                                    <p className="text-green-600 text-sm">
                                        This quote has been approved and is ready to be converted to a work order
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowConvertDialog(true)}
                                    className="w-full bg-nextgen-green hover:bg-nextgen-green-dark text-white px-4 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Convert to Work Order
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Provision Form - Shows when staff clicks "Provide Quote" */}
                    {showProvisionForm && (
                        <QuoteProvisionForm
                            quote={quote}
                            onSuccess={handleQuoteProvided}
                            onCancel={() => setShowProvisionForm(false)}
                        />
                    )}

                    {/* Quote Details */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Property</label>
                                <p className="text-gray-900">{quote.property_name}</p>
                                {quote.property_address && (
                                    <p className="text-sm text-gray-600">{quote.property_address}</p>
                                )}
                            </div>

                            {quote.work_type && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Type of Work</label>
                                    <p className="text-gray-900">{quote.work_type}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-600">Description</label>
                                <p className="text-gray-900 whitespace-pre-wrap">{quote.description}</p>
                            </div>

                            {quote.scope_of_work && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Scope of Work</label>
                                    <p className="text-gray-900 whitespace-pre-wrap">{quote.scope_of_work}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Contact Person</label>
                                    <p className="text-gray-900">{quote.contact_person}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Contact Email</label>
                                    <p className="text-gray-900">{quote.contact_email}</p>
                                </div>
                            </div>

                            {quote.required_by_date && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Required By</label>
                                    <p className="text-gray-900">
                                        {new Date(quote.required_by_date).toLocaleDateString()}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-600">Submitted By</label>
                                <p className="text-gray-900">{quote.creator?.full_name}</p>
                                <p className="text-sm text-gray-600">{quote.creator?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Provided Quote Details - Shows when status is Quoted or later */}
                    {quote.estimated_cost && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Provided Quote</h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Estimated Cost</label>
                                        <p className="text-2xl font-bold text-gray-900">
                                            ${parseFloat(quote.estimated_cost).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Estimated Hours</label>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {parseFloat(quote.estimated_hours).toFixed(1)} hrs
                                        </p>
                                    </div>
                                </div>

                                {quote.quote_notes && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Quote Notes</label>
                                        <p className="text-gray-900 whitespace-pre-wrap">{quote.quote_notes}</p>
                                    </div>
                                )}

                                {quote.quote_valid_until && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Valid Until</label>
                                        <p className="text-gray-900">
                                            {new Date(quote.quote_valid_until).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                {quote.itemized_breakdown && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Itemized Breakdown</label>
                                        <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded mt-2 overflow-auto">
                                            {JSON.stringify(quote.itemized_breakdown, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Attachments Section */}
                    <QuoteAttachments
                        quoteId={quote?.id}
                        canUpload={!['Converted', 'Declined', 'Expired'].includes(quote?.status)}
                    />

                    {/* Messages Section */}
                    <QuoteMessages
                        quoteId={quote?.id}
                        currentUserId={user?.id}
                        canAddMessage={!['Converted', 'Declined', 'Expired'].includes(quote?.status)}
                    />

                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/quotes')}
                        className="w-full bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                        Back to Quotes
                    </button>
                </div>
            </main>

            <MobileNavigation />

            {/* T100: Conversion Dialog */}
            {showConvertDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Convert to Work Order</h2>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <p className="text-blue-900 font-semibold mb-2">Quote Summary</p>
                                <div className="text-sm text-blue-800 space-y-1">
                                    <p><span className="font-medium">Quote #:</span> {quote.quote_number}</p>
                                    <p><span className="font-medium">Property:</span> {quote.property_name}</p>
                                    <p><span className="font-medium">Estimated Cost:</span> ${parseFloat(quote.estimated_cost).toFixed(2)}</p>
                                    <p><span className="font-medium">Estimated Hours:</span> {parseFloat(quote.estimated_hours).toFixed(1)} hrs</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Supplier Name
                                    </label>
                                    <input
                                        type="text"
                                        name="supplier_name"
                                        value={convertFormData.supplier_name}
                                        onChange={handleConvertFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent"
                                        placeholder="Williams Property Service"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Schedule Date
                                    </label>
                                    <input
                                        type="date"
                                        name="schedule_date"
                                        value={convertFormData.schedule_date}
                                        onChange={handleConvertFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        PO Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="po_number"
                                        value={convertFormData.po_number}
                                        onChange={handleConvertFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nextgen-green focus:border-transparent"
                                        placeholder="Purchase Order Number"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowConvertDialog(false)}
                                    disabled={converting}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConvertToWorkOrder}
                                    disabled={converting}
                                    className="flex-1 px-4 py-2 bg-nextgen-green text-white rounded-lg hover:bg-nextgen-green-dark font-medium disabled:opacity-50"
                                >
                                    {converting ? 'Converting...' : 'Convert to Work Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* T116: Request Info Dialog */}
            {showRequestInfoDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Request More Information</h2>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <p className="text-blue-900 font-semibold mb-2">Quote: {quote.quote_number}</p>
                                <p className="text-sm text-blue-800 mb-1">Property: {quote.property_name}</p>
                                <p className="text-sm text-blue-800">{quote.title}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        What additional information do you need from the client?
                                    </label>
                                    <textarea
                                        value={infoRequestMessage}
                                        onChange={(e) => setInfoRequestMessage(e.target.value)}
                                        placeholder="e.g., Please provide photos of the roof damage and measurements of the affected area..."
                                        rows={5}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        The quote status will change to "Information Requested" and the client will be notified.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRequestInfoDialog(false);
                                        setInfoRequestMessage('');
                                    }}
                                    disabled={requestingInfo}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRequestInfo}
                                    disabled={requestingInfo || !infoRequestMessage.trim()}
                                    className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium disabled:opacity-50"
                                >
                                    {requestingInfo ? 'Requesting...' : 'Request Information'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteDetailPage;
