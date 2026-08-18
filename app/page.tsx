'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, Edit3, FileDown, IndianRupee, Menu, MessageCircle, Plus, ReceiptText, Sparkles, Trash2, X, Wallet, AlignLeft } from 'lucide-react'
import { getReceipts, createReceipt, updateReceipt, deleteReceipt, getNextReceiptNumber, getExpenses, createExpense, updateExpense, deleteExpense } from './actions'
import { useAlert } from '@/components/alert-provider'

type PaymentMethod = 'Cash' | 'Online'
type Receipt = { id: string; _id: string; receiptNo: string; houseNo: string; amount: number; paymentMethod: PaymentMethod; date: string }
type ReceiptFormState = { receiptNo: string; houseNo: string; amount: string; paymentMethod: PaymentMethod; date: string }

type Expense = { id: string; _id: string; description: string; amount: number; date: string }
type ExpenseFormState = { description: string; amount: string; date: string }

const GANESH_IMAGE = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-08-16%20at%207.17.43%20PM-4XxX7fKWMzPhks0uj7hRUfdmZSLuFy.jpeg'
const today = () => new Date().toISOString().slice(0, 10)
const formatMoney = (value: number) => `Rs. ${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const formatDate = (value: string) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))

function blankReceiptForm(nextReceiptNo: string): ReceiptFormState { return { receiptNo: nextReceiptNo, houseNo: '', amount: '', paymentMethod: 'Cash', date: today() } }
function blankExpenseForm(): ExpenseFormState { return { description: '', amount: '', date: today() } }

export default function Page() {
  const [activeTab, setActiveTab] = useState<'create' | 'receipts' | 'expenses'>('create')
  const [createMode, setCreateMode] = useState<'receipt' | 'expense'>('receipt')
  
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  
  const [receiptForm, setReceiptForm] = useState<ReceiptFormState>(() => blankReceiptForm('001'))
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(() => blankExpenseForm())
  
  const [receiptErrors, setReceiptErrors] = useState<Partial<Record<keyof ReceiptFormState, string>>>({})
  const [expenseErrors, setExpenseErrors] = useState<Partial<Record<keyof ExpenseFormState, string>>>({})
  
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const showAlert = useAlert()
  const [loading, setLoading] = useState(true)

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedReceipts, fetchedExpenses, nextNo] = await Promise.all([
          getReceipts(),
          getExpenses(),
          getNextReceiptNumber()
        ]);
        setReceipts(fetchedReceipts as Receipt[]);
        setExpenses(fetchedExpenses as Expense[]);
        setReceiptForm(blankReceiptForm(nextNo));
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [])

  const totals = useMemo(() => { 
    const todayReceipts = receipts.filter((receipt) => receipt.date === today()); 
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return { 
      today: todayReceipts.reduce((sum, receipt) => sum + receipt.amount, 0), 
      total: receipts.reduce((sum, receipt) => sum + receipt.amount, 0), 
      count: receipts.length, 
      todayCount: todayReceipts.length,
      totalExpenses
    } 
  }, [receipts, expenses])

  function updateReceiptField(field: keyof ReceiptFormState, value: string) { setReceiptForm((current) => ({ ...current, [field]: value })); setReceiptErrors((current) => ({ ...current, [field]: undefined })) }
  function updateExpenseField(field: keyof ExpenseFormState, value: string) { setExpenseForm((current) => ({ ...current, [field]: value })); setExpenseErrors((current) => ({ ...current, [field]: undefined })) }

  function validateReceipt() { 
    const next: typeof receiptErrors = {}; 
    if (!receiptForm.receiptNo.trim()) next.receiptNo = 'Add a receipt number.'; 
    if (!receiptForm.houseNo.trim()) next.houseNo = 'Add a house or customer number.'; 
    if (!receiptForm.amount || Number(receiptForm.amount) <= 0) next.amount = 'Enter an amount greater than zero.'; 
    if (!receiptForm.date) next.date = 'Choose a date.'; 
    setReceiptErrors(next); 
    return Object.keys(next).length === 0 
  }

  function validateExpense() { 
    const next: typeof expenseErrors = {}; 
    if (!expenseForm.description.trim()) next.description = 'Add a description.'; 
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) next.amount = 'Enter an amount greater than zero.'; 
    if (!expenseForm.date) next.date = 'Choose a date.'; 
    setExpenseErrors(next); 
    return Object.keys(next).length === 0 
  }

  async function handleSaveReceipt(event: React.FormEvent) { 
    event.preventDefault(); 
    if (!validateReceipt()) return; 
    
    setIsSubmitting(true);
    const data = { receiptNo: receiptForm.receiptNo.trim(), houseNo: receiptForm.houseNo.trim(), amount: Number(receiptForm.amount), paymentMethod: receiptForm.paymentMethod, date: receiptForm.date }; 
    
    try {
      if (editingReceiptId) { 
        const updated = await updateReceipt(editingReceiptId, data);
        if (updated) {
          setReceipts((current) => current.map((r) => r.id === editingReceiptId ? updated as Receipt : r)); 
          setSelectedReceipt(updated as Receipt); 
          setEditingReceiptId(null);
          
          // Re-fetch next sequence after edit just in case
          const nextNo = await getNextReceiptNumber();
          setReceiptForm(blankReceiptForm(nextNo));
        }
      } else { 
        const newReceipt = await createReceipt(data);
        setReceipts((current) => [newReceipt as Receipt, ...current]); 
        setSelectedReceipt(newReceipt as Receipt);
        
        // After creating, fetch the next sequence
        const nextNo = await getNextReceiptNumber();
        setReceiptForm(blankReceiptForm(nextNo));
      } 
    } catch (e) {
      console.error("Save error", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveExpense(event: React.FormEvent) {
    event.preventDefault();
    if (!validateExpense()) return;

    setIsSubmitting(true);
    const data = { description: expenseForm.description.trim(), amount: Number(expenseForm.amount), date: expenseForm.date };

    try {
      if (editingExpenseId) {
        const updated = await updateExpense(editingExpenseId, data);
        if (updated) {
          setExpenses((current) => current.map((e) => e.id === editingExpenseId ? updated as Expense : e));
          setEditingExpenseId(null);
          setExpenseForm(blankExpenseForm());
          setActiveTab('expenses'); // Switch to expenses tab to see the update
        }
      } else {
        const newExpense = await createExpense(data);
        setExpenses((current) => [newExpense as Expense, ...current]);
        setExpenseForm(blankExpenseForm());
        setActiveTab('expenses'); // Switch to expenses tab
      }
    } catch (e) {
      console.error("Save error", e);
    } finally {
      setIsSubmitting(false);
    }
  }

  function editReceiptRow(receipt: Receipt) { 
    setSelectedReceipt(null); 
    setActiveTab('create');
    setCreateMode('receipt');
    setEditingReceiptId(receipt.id); 
    setReceiptForm({ receiptNo: receipt.receiptNo, houseNo: receipt.houseNo, amount: String(receipt.amount), paymentMethod: receipt.paymentMethod, date: receipt.date }); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function editExpenseRow(expense: Expense) {
    setActiveTab('create');
    setCreateMode('expense');
    setEditingExpenseId(expense.id);
    setExpenseForm({ description: expense.description, amount: String(expense.amount), date: expense.date });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeleteReceipt(id: string) { 
    const confirmed = await showAlert({ type: 'confirm', title: 'Delete Receipt?', message: 'This receipt will be permanently removed and cannot be recovered.', confirmText: 'Yes, Delete', cancelText: 'Cancel' });
    if (!confirmed) return;
    setReceipts((current) => current.filter((r) => r.id !== id)); 
    setSelectedReceipt(null); 
    if (editingReceiptId === id) { setEditingReceiptId(null); }
    await deleteReceipt(id);
    await showAlert({ type: 'success', title: 'Receipt Deleted', message: 'The receipt has been permanently deleted.', confirmText: 'OK' });
  }

  async function handleDeleteExpense(id: string) {
    const confirmed = await showAlert({ type: 'confirm', title: 'Delete Expense?', message: 'This expense will be permanently removed and cannot be recovered.', confirmText: 'Yes, Delete', cancelText: 'Cancel' });
    if (!confirmed) return;
    setExpenses((current) => current.filter((e) => e.id !== id));
    if (editingExpenseId === id) { setEditingExpenseId(null); }
    await deleteExpense(id);
    await showAlert({ type: 'success', title: 'Expense Deleted', message: 'The expense has been permanently deleted.', confirmText: 'OK' });
  }

  function shareOnWhatsApp(receipt: Receipt) { const text = `MORYA GROUP%0AReceipt No. ${receipt.receiptNo}%0AHouse No. ${receipt.houseNo}%0AAmount: ${formatMoney(receipt.amount)}%0APayment: ${receipt.paymentMethod}%0ADate: ${formatDate(receipt.date)}`; window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer') }

  if (loading) {
    return <main className="receipt-app"><div className="ganesh-loader"><img src={GANESH_IMAGE} alt="Shree Ganeshay Namah" /><p>|| श्री गणेशाय नमः ||</p><strong>MORYA GROUP</strong></div></main>
  }

  return <main className="receipt-app">
    <header className="topbar">
      <a className="brand-lockup" href="#overview" onClick={(e) => { e.preventDefault(); setActiveTab('create') }}>
        <div className="brand-mark"><img src={GANESH_IMAGE} alt="" /></div>
        <div><p className="brand-name">MORYA GROUP</p><p className="brand-caption">Digital records</p></div>
      </a>
      <button className="mobile-menu" aria-label="Toggle menu" onClick={() => setMobileOpen((open) => !open)}><Menu /></button>
      <nav className={mobileOpen ? 'top-nav is-open' : 'top-nav'} aria-label="Main navigation">
        <a className={activeTab === 'create' ? 'active' : ''} href="#create" onClick={(e) => { e.preventDefault(); setActiveTab('create'); setMobileOpen(false) }}>Create</a>
        <a className={activeTab === 'receipts' ? 'active' : ''} href="#receipts" onClick={(e) => { e.preventDefault(); setActiveTab('receipts'); setMobileOpen(false) }}>Receipts</a>
        <a className={activeTab === 'expenses' ? 'active' : ''} href="#expenses" onClick={(e) => { e.preventDefault(); setActiveTab('expenses'); setMobileOpen(false) }}>Expenses</a>
      </nav>
    </header>
    
    <div className="app-shell">
      <section className="summary-grid" aria-label="Collection summary">
        <article className="summary-card summary-primary">
          <div className="summary-icon"><IndianRupee /></div>
          <p>Today&apos;s amount</p>
          <strong>{formatMoney(totals.today)}</strong>
          <span>{totals.todayCount} receipt{totals.todayCount === 1 ? '' : 's'} today</span>
        </article>
        <article className="summary-card">
          <div className="summary-icon muted"><Sparkles /></div>
          <p>Total collected</p>
          <strong>{formatMoney(totals.total)}</strong>
          <span>Across {totals.count} receipt{totals.count === 1 ? '' : 's'}</span>
        </article>
        <article className="summary-card expense-summary">
          <div className="summary-icon error-muted"><Wallet /></div>
          <p>Total Expenses</p>
          <strong>{formatMoney(totals.totalExpenses)}</strong>
          <span>Across {expenses.length} expense{expenses.length === 1 ? '' : 's'}</span>
        </article>
      </section>

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <section className="workspace-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
          
          <div className="tab-toggles" style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--surface)', padding: '8px', borderRadius: '12px', border: '1px solid var(--border)' }}>
             <button 
                type="button" 
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: createMode === 'receipt' ? 'var(--primary)' : 'transparent', color: createMode === 'receipt' ? 'white' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setCreateMode('receipt')}
             >
                Make Receipt
             </button>
             <button 
                type="button" 
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: createMode === 'expense' ? 'var(--error)' : 'transparent', color: createMode === 'expense' ? 'white' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setCreateMode('expense')}
             >
                Add Expense
             </button>
          </div>

          {createMode === 'receipt' ? (
            <form className="entry-card" id="new-receipt" onSubmit={handleSaveReceipt} noValidate>
              <div className="card-heading">
                <div><p className="eyebrow">{editingReceiptId ? 'Edit entry' : 'New entry'}</p><h2>{editingReceiptId ? 'Update receipt' : 'Create a receipt'}</h2></div>
                <span className="required-note">* Required</span>
              </div>
              <div className="form-grid">
                <label className={receiptErrors.receiptNo ? 'field invalid' : 'field'}><span>Receipt number <em>*</em></span><input value={receiptForm.receiptNo} onChange={(event) => updateReceiptField('receiptNo', event.target.value)} placeholder="e.g. 001" aria-invalid={Boolean(receiptErrors.receiptNo)} />{receiptErrors.receiptNo && <small>{receiptErrors.receiptNo}</small>}</label>
                <label className={receiptErrors.houseNo ? 'field invalid' : 'field'}><span>House / donor no. <em>*</em></span><input value={receiptForm.houseNo} onChange={(event) => updateReceiptField('houseNo', event.target.value)} placeholder="e.g. H-204" aria-invalid={Boolean(receiptErrors.houseNo)} />{receiptErrors.houseNo && <small>{receiptErrors.houseNo}</small>}</label>
                <label className={receiptErrors.amount ? 'field invalid amount-field' : 'field amount-field'}><span>Amount <em>*</em></span><div className="amount-input"><span>Rs.</span><input type="number" min="1" step="0.01" value={receiptForm.amount} onChange={(event) => updateReceiptField('amount', event.target.value)} placeholder="0.00" aria-invalid={Boolean(receiptErrors.amount)} /></div>{receiptErrors.amount && <small>{receiptErrors.amount}</small>}</label>
                <div className="field"><span>Payment method <em>*</em></span><div className="method-toggle" role="group" aria-label="Payment method"><button type="button" className={receiptForm.paymentMethod === 'Cash' ? 'selected' : ''} onClick={() => updateReceiptField('paymentMethod', 'Cash')}>Cash</button><button type="button" className={receiptForm.paymentMethod === 'Online' ? 'selected' : ''} onClick={() => updateReceiptField('paymentMethod', 'Online')}>Online</button></div></div>
                <label className={receiptErrors.date ? 'field invalid' : 'field'}><span>Date <em>*</em></span><div className="date-input"><CalendarDays /><input type="date" value={receiptForm.date} onChange={(event) => updateReceiptField('date', event.target.value)} aria-invalid={Boolean(receiptErrors.date)} /></div>{receiptErrors.date && <small>{receiptErrors.date}</small>}</label>
              </div>
              <div className="form-footer">
                <p><Check /> Your receipt will be saved securely.</p>
                <div className="form-actions">
                  {editingReceiptId && <button className="cancel-button" type="button" onClick={async () => { setEditingReceiptId(null); setReceiptForm(blankReceiptForm(await getNextReceiptNumber())) }}>Cancel</button>}
                  <button className="done-button" type="submit" disabled={isSubmitting}><Plus data-icon="inline-start" /> {isSubmitting ? 'Saving...' : (editingReceiptId ? 'Save changes' : 'Done & generate receipt')}</button>
                </div>
              </div>
            </form>
          ) : (
            <form className="entry-card" id="new-expense" onSubmit={handleSaveExpense} noValidate style={{ borderTop: '4px solid var(--error)' }}>
              <div className="card-heading">
                <div><p className="eyebrow" style={{ color: 'var(--error)' }}>{editingExpenseId ? 'Edit expense' : 'New expense'}</p><h2>{editingExpenseId ? 'Update expense' : 'Record an expense'}</h2></div>
                <span className="required-note">* Required</span>
              </div>
              <div className="form-grid">
                <label className={expenseErrors.description ? 'field invalid' : 'field'} style={{ gridColumn: '1 / -1' }}>
                  <span>Description / Details <em>*</em></span>
                  <input value={expenseForm.description} onChange={(event) => updateExpenseField('description', event.target.value)} placeholder="e.g. Decoration materials, Mandap rent" aria-invalid={Boolean(expenseErrors.description)} />
                  {expenseErrors.description && <small>{expenseErrors.description}</small>}
                </label>
                <label className={expenseErrors.amount ? 'field invalid amount-field' : 'field amount-field'}>
                  <span>Amount <em>*</em></span>
                  <div className="amount-input"><span>Rs.</span><input type="number" min="1" step="0.01" value={expenseForm.amount} onChange={(event) => updateExpenseField('amount', event.target.value)} placeholder="0.00" aria-invalid={Boolean(expenseErrors.amount)} /></div>
                  {expenseErrors.amount && <small>{expenseErrors.amount}</small>}
                </label>
                <label className={expenseErrors.date ? 'field invalid' : 'field'}>
                  <span>Date <em>*</em></span>
                  <div className="date-input"><CalendarDays /><input type="date" value={expenseForm.date} onChange={(event) => updateExpenseField('date', event.target.value)} aria-invalid={Boolean(expenseErrors.date)} /></div>
                  {expenseErrors.date && <small>{expenseErrors.date}</small>}
                </label>
              </div>
              <div className="form-footer">
                <p><Check /> Expense recorded securely.</p>
                <div className="form-actions">
                  {editingExpenseId && <button className="cancel-button" type="button" onClick={() => { setEditingExpenseId(null); setExpenseForm(blankExpenseForm()) }}>Cancel</button>}
                  <button className="done-button" type="submit" disabled={isSubmitting} style={{ background: 'var(--error)' }}><Plus data-icon="inline-start" /> {isSubmitting ? 'Saving...' : (editingExpenseId ? 'Save changes' : 'Save Expense')}</button>
                </div>
              </div>
            </form>
          )}
        </section>
      )}

      {/* RECEIPTS TAB */}
      {activeTab === 'receipts' && (
        <section className="history-section" id="history">
          <div className="section-heading"><div><p className="eyebrow">Your records</p><h2>Receipt History</h2></div><span className="receipt-count">{receipts.length} total</span></div>
          {receipts.length === 0 ? <div className="empty-state"><ReceiptText /><p>No receipts yet</p><span>Your saved receipts will appear here.</span></div> : <div className="receipt-list">{receipts.map((receipt) => <div className="receipt-row" key={receipt.id}><button className="receipt-row-main-button" onClick={() => setSelectedReceipt(receipt)}><span className="receipt-row-mark"><ReceiptText /></span><span className="receipt-row-main"><strong>Receipt #{receipt.receiptNo}</strong><small>House / donor {receipt.houseNo} · {formatDate(receipt.date)}</small></span><span className="payment-badge">{receipt.paymentMethod}</span><strong className="row-amount">{formatMoney(receipt.amount)}</strong></button><div className="row-actions"><button onClick={() => editReceiptRow(receipt)} aria-label={`Edit receipt ${receipt.receiptNo}`}><Edit3 /></button><button onClick={() => handleDeleteReceipt(receipt.id)} aria-label={`Delete receipt ${receipt.receiptNo}`}><Trash2 /></button></div></div>)}</div>}
        </section>
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <section className="history-section" id="expenses">
          <div className="section-heading"><div><p className="eyebrow" style={{ color: 'var(--error)' }}>Your records</p><h2>Expense History</h2></div><span className="receipt-count">{expenses.length} total</span></div>
          {expenses.length === 0 ? <div className="empty-state"><Wallet /><p>No expenses yet</p><span>Your recorded expenses will appear here.</span></div> : <div className="receipt-list">{expenses.map((expense) => <div className="receipt-row" key={expense.id}><div className="receipt-row-main-button" style={{ cursor: 'default' }}><span className="receipt-row-mark" style={{ background: 'var(--error-muted)', color: 'var(--error)' }}><AlignLeft /></span><span className="receipt-row-main"><strong>{expense.description}</strong><small>{formatDate(expense.date)}</small></span><strong className="row-amount" style={{ color: 'var(--error)' }}>- {formatMoney(expense.amount)}</strong></div><div className="row-actions"><button onClick={() => editExpenseRow(expense)} aria-label={`Edit expense ${expense.description}`}><Edit3 /></button><button onClick={() => handleDeleteExpense(expense.id)} aria-label={`Delete expense ${expense.description}`}><Trash2 /></button></div></div>)}</div>}
        </section>
      )}

    </div>
    
    {/* RECEIPT PREVIEW MODAL */}
    {selectedReceipt && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedReceipt(null) }}>
      <section className="receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-preview-title">
        <button className="close-modal" onClick={() => setSelectedReceipt(null)} aria-label="Close preview"><X /></button>
        <div className="preview-paper" id="printable-receipt">
          <div className="preview-ornament">|| श्री गणेशाय नमः ||</div>
          <div className="preview-brand"><div className="brand-mark"><img src={GANESH_IMAGE} alt="" /></div><div><strong>MORYA GROUP</strong><span>Digital donation receipt</span></div></div>
          <div className="preview-title"><p>RECEIPT</p><strong>#{selectedReceipt.receiptNo}</strong></div>
          <div className="preview-total"><span>Total paid</span><strong>{formatMoney(selectedReceipt.amount)}</strong></div>
          <div className="preview-details"><div><span>House / donor no.</span><strong>{selectedReceipt.houseNo}</strong></div><div><span>Payment method</span><strong>{selectedReceipt.paymentMethod}</strong></div><div><span>Date issued</span><strong>{formatDate(selectedReceipt.date)}</strong></div></div>
          <p className="preview-thanks">|| आपका सहयोग ||<br />Thank you for your contribution.</p>
        </div>
        <div className="modal-actions">
          <button className="outline-action" onClick={() => window.print()}><FileDown data-icon="inline-start" /> Download PDF</button>
          <button className="edit-action" onClick={() => editReceiptRow(selectedReceipt)}><Edit3 data-icon="inline-start" /> Edit</button>
          <button className="whatsapp-action" onClick={() => shareOnWhatsApp(selectedReceipt)}><MessageCircle data-icon="inline-start" /> Share on WhatsApp</button>
          <button className="delete-action" onClick={() => handleDeleteReceipt(selectedReceipt.id)}><Trash2 data-icon="inline-start" /> Delete</button>
        </div>
      </section>
    </div>}
  </main>
}
