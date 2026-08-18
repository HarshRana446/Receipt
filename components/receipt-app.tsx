'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { CalendarDays, Check, Edit3, FileDown, IndianRupee, Menu, MessageCircle, Plus, ReceiptText, Sparkles, Trash2, X, Wallet, AlignLeft } from 'lucide-react'
import { createReceipt, updateReceipt, deleteReceipt, getExpenses, createExpense, updateExpense, deleteExpense, getReceipts } from '@/app/actions'
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

function computeNextReceiptNo(receipts: Receipt[]): string {
  if (receipts.length === 0) return '001'
  const max = Math.max(...receipts.map(r => Number(r.receiptNo) || 0))
  return String(max + 1).padStart(3, '0')
}

function blankReceiptForm(nextReceiptNo: string): ReceiptFormState { return { receiptNo: nextReceiptNo, houseNo: '', amount: '', paymentMethod: 'Cash', date: today() } }
function blankExpenseForm(): ExpenseFormState { return { description: '', amount: '', date: today() } }

interface Props {
  initialReceipts: Receipt[]
  initialExpenses: Expense[]
}

export default function ReceiptApp({ initialReceipts, initialExpenses }: Props) {
  const [activeTab, setActiveTab] = useState<'create' | 'receipts' | 'expenses'>('create')
  const [createMode, setCreateMode] = useState<'receipt' | 'expense'>('receipt')
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [receiptForm, setReceiptForm] = useState<ReceiptFormState>(() => blankReceiptForm(computeNextReceiptNo(initialReceipts)))
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(() => blankExpenseForm())
  const [receiptErrors, setReceiptErrors] = useState<Partial<Record<keyof ReceiptFormState, string>>>({})
  const [expenseErrors, setExpenseErrors] = useState<Partial<Record<keyof ExpenseFormState, string>>>({})
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const showAlert = useAlert()

  const totals = useMemo(() => {
    const todayReceipts = receipts.filter((r) => r.date === today())
    return {
      today: todayReceipts.reduce((s, r) => s + r.amount, 0),
      total: receipts.reduce((s, r) => s + r.amount, 0),
      count: receipts.length,
      todayCount: todayReceipts.length,
      totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
    }
  }, [receipts, expenses])

  function updateReceiptField(field: keyof ReceiptFormState, value: string) { setReceiptForm(c => ({ ...c, [field]: value })); setReceiptErrors(c => ({ ...c, [field]: undefined })) }
  function updateExpenseField(field: keyof ExpenseFormState, value: string) { setExpenseForm(c => ({ ...c, [field]: value })); setExpenseErrors(c => ({ ...c, [field]: undefined })) }

  function validateReceipt() {
    const next: typeof receiptErrors = {}
    if (!receiptForm.receiptNo.trim()) next.receiptNo = 'Add a receipt number.'
    if (!receiptForm.houseNo.trim()) next.houseNo = 'Add a house or customer number.'
    if (!receiptForm.amount || Number(receiptForm.amount) <= 0) next.amount = 'Enter an amount greater than zero.'
    if (!receiptForm.date) next.date = 'Choose a date.'
    setReceiptErrors(next)
    return Object.keys(next).length === 0
  }

  function validateExpense() {
    const next: typeof expenseErrors = {}
    if (!expenseForm.description.trim()) next.description = 'Add a description.'
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) next.amount = 'Enter an amount greater than zero.'
    if (!expenseForm.date) next.date = 'Choose a date.'
    setExpenseErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSaveReceipt(event: React.FormEvent) {
    event.preventDefault()
    if (!validateReceipt()) return
    setIsSubmitting(true)
    const data = { receiptNo: receiptForm.receiptNo.trim(), houseNo: receiptForm.houseNo.trim(), amount: Number(receiptForm.amount), paymentMethod: receiptForm.paymentMethod, date: receiptForm.date }
    try {
      if (editingReceiptId) {
        const updated = await updateReceipt(editingReceiptId, data)
        if (updated) {
          const newReceipts = receipts.map(r => r.id === editingReceiptId ? updated as Receipt : r)
          setReceipts(newReceipts)
          setSelectedReceipt(updated as Receipt)
          setEditingReceiptId(null)
          setReceiptForm(blankReceiptForm(computeNextReceiptNo(newReceipts)))
        }
      } else {
        const newReceipt = await createReceipt(data)
        const newReceipts = [newReceipt as Receipt, ...receipts]
        setReceipts(newReceipts)
        setSelectedReceipt(newReceipt as Receipt)
        setReceiptForm(blankReceiptForm(computeNextReceiptNo(newReceipts)))
      }
    } catch (e) { console.error(e) } finally { setIsSubmitting(false) }
  }

  async function handleSaveExpense(event: React.FormEvent) {
    event.preventDefault()
    if (!validateExpense()) return
    setIsSubmitting(true)
    const data = { description: expenseForm.description.trim(), amount: Number(expenseForm.amount), date: expenseForm.date }
    try {
      if (editingExpenseId) {
        const updated = await updateExpense(editingExpenseId, data)
        if (updated) {
          setExpenses(expenses.map(e => e.id === editingExpenseId ? updated as Expense : e))
          setEditingExpenseId(null)
          setExpenseForm(blankExpenseForm())
          setActiveTab('expenses')
        }
      } else {
        const newExpense = await createExpense(data)
        setExpenses([newExpense as Expense, ...expenses])
        setExpenseForm(blankExpenseForm())
        setActiveTab('expenses')
      }
    } catch (e) { console.error(e) } finally { setIsSubmitting(false) }
  }

  function editReceiptRow(receipt: Receipt) {
    setSelectedReceipt(null); setActiveTab('create'); setCreateMode('receipt')
    setEditingReceiptId(receipt.id)
    setReceiptForm({ receiptNo: receipt.receiptNo, houseNo: receipt.houseNo, amount: String(receipt.amount), paymentMethod: receipt.paymentMethod, date: receipt.date })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function editExpenseRow(expense: Expense) {
    setActiveTab('create'); setCreateMode('expense'); setEditingExpenseId(expense.id)
    setExpenseForm({ description: expense.description, amount: String(expense.amount), date: expense.date })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDeleteReceipt(id: string) {
    const confirmed = await showAlert({ type: 'confirm', title: 'Delete Receipt?', message: 'This receipt will be permanently removed and cannot be recovered.', confirmText: 'Yes, Delete', cancelText: 'Cancel' })
    if (!confirmed) return
    const newReceipts = receipts.filter(r => r.id !== id)
    setReceipts(newReceipts); setSelectedReceipt(null)
    if (editingReceiptId === id) { setEditingReceiptId(null); setReceiptForm(blankReceiptForm(computeNextReceiptNo(newReceipts))) }
    await deleteReceipt(id)
    await showAlert({ type: 'success', title: 'Receipt Deleted', message: 'The receipt has been permanently deleted.', confirmText: 'OK' })
  }

  async function handleDeleteExpense(id: string) {
    const confirmed = await showAlert({ type: 'confirm', title: 'Delete Expense?', message: 'This expense will be permanently removed and cannot be recovered.', confirmText: 'Yes, Delete', cancelText: 'Cancel' })
    if (!confirmed) return
    setExpenses(expenses.filter(e => e.id !== id))
    if (editingExpenseId === id) { setEditingExpenseId(null); setExpenseForm(blankExpenseForm()) }
    await deleteExpense(id)
    await showAlert({ type: 'success', title: 'Expense Deleted', message: 'The expense has been permanently deleted.', confirmText: 'OK' })
  }

  function shareOnWhatsApp(receipt: Receipt) {
    const text = `MORYA GROUP%0AReceipt No. ${receipt.receiptNo}%0AHouse No. ${receipt.houseNo}%0AAmount: ${formatMoney(receipt.amount)}%0APayment: ${receipt.paymentMethod}%0ADate: ${formatDate(receipt.date)}`
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  return <main className="receipt-app">
    <header className="topbar">
      <a className="brand-lockup" href="#" onClick={e => { e.preventDefault(); setActiveTab('create') }}>
        <div className="brand-mark"><img src={GANESH_IMAGE} alt="" /></div>
        <div><p className="brand-name">MORYA GROUP</p><p className="brand-caption">Digital records</p></div>
      </a>
      <button className="mobile-menu" aria-label="Toggle menu" onClick={() => setMobileOpen(o => !o)}><Menu /></button>
      <nav className={mobileOpen ? 'top-nav is-open' : 'top-nav'} aria-label="Main navigation">
        <a className={activeTab === 'create' ? 'active' : ''} href="#" onClick={e => { e.preventDefault(); setActiveTab('create'); setMobileOpen(false) }}>Create</a>
        <a className={activeTab === 'receipts' ? 'active' : ''} href="#" onClick={e => { e.preventDefault(); setActiveTab('receipts'); setMobileOpen(false) }}>Receipts</a>
        <a className={activeTab === 'expenses' ? 'active' : ''} href="#" onClick={e => { e.preventDefault(); setActiveTab('expenses'); setMobileOpen(false) }}>Expenses</a>
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

      {activeTab === 'create' && (
        <section className="workspace-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
          <div className="tab-toggles">
            <button type="button" className={createMode === 'receipt' ? 'toggle-btn toggle-receipt active' : 'toggle-btn toggle-receipt'} onClick={() => setCreateMode('receipt')}>Make Receipt</button>
            <button type="button" className={createMode === 'expense' ? 'toggle-btn toggle-expense active' : 'toggle-btn toggle-expense'} onClick={() => setCreateMode('expense')}>Add Expense</button>
          </div>

          {createMode === 'receipt' ? (
            <form className="entry-card" onSubmit={handleSaveReceipt} noValidate>
              <div className="card-heading"><div><p className="eyebrow">{editingReceiptId ? 'Edit entry' : 'New entry'}</p><h2>{editingReceiptId ? 'Update receipt' : 'Create a receipt'}</h2></div><span className="required-note">* Required</span></div>
              <div className="form-grid">
                <label className={receiptErrors.receiptNo ? 'field invalid' : 'field'}><span>Receipt number <em>*</em></span><input value={receiptForm.receiptNo} onChange={e => updateReceiptField('receiptNo', e.target.value)} placeholder="e.g. 001" />{receiptErrors.receiptNo && <small>{receiptErrors.receiptNo}</small>}</label>
                <label className={receiptErrors.houseNo ? 'field invalid' : 'field'}><span>House / donor no. <em>*</em></span><input value={receiptForm.houseNo} onChange={e => updateReceiptField('houseNo', e.target.value)} placeholder="e.g. H-204" />{receiptErrors.houseNo && <small>{receiptErrors.houseNo}</small>}</label>
                <label className={receiptErrors.amount ? 'field invalid amount-field' : 'field amount-field'}><span>Amount <em>*</em></span><div className="amount-input"><span>Rs.</span><input type="number" min="1" step="0.01" value={receiptForm.amount} onChange={e => updateReceiptField('amount', e.target.value)} placeholder="0.00" /></div>{receiptErrors.amount && <small>{receiptErrors.amount}</small>}</label>
                <div className="field"><span>Payment method <em>*</em></span><div className="method-toggle" role="group"><button type="button" className={receiptForm.paymentMethod === 'Cash' ? 'selected' : ''} onClick={() => updateReceiptField('paymentMethod', 'Cash')}>Cash</button><button type="button" className={receiptForm.paymentMethod === 'Online' ? 'selected' : ''} onClick={() => updateReceiptField('paymentMethod', 'Online')}>Online</button></div></div>
                <label className={receiptErrors.date ? 'field invalid' : 'field'}><span>Date <em>*</em></span><div className="date-input"><CalendarDays /><input type="date" value={receiptForm.date} onChange={e => updateReceiptField('date', e.target.value)} /></div>{receiptErrors.date && <small>{receiptErrors.date}</small>}</label>
              </div>
              <div className="form-footer">
                <p><Check /> Saved securely to the cloud.</p>
                <div className="form-actions">
                  {editingReceiptId && <button className="cancel-button" type="button" onClick={() => { setEditingReceiptId(null); setReceiptForm(blankReceiptForm(computeNextReceiptNo(receipts))) }}>Cancel</button>}
                  <button className="done-button" type="submit" disabled={isSubmitting}><Plus data-icon="inline-start" /> {isSubmitting ? 'Saving...' : (editingReceiptId ? 'Save changes' : 'Done & generate receipt')}</button>
                </div>
              </div>
            </form>
          ) : (
            <form className="entry-card" onSubmit={handleSaveExpense} noValidate style={{ borderTop: '4px solid var(--error)' }}>
              <div className="card-heading"><div><p className="eyebrow" style={{ color: 'var(--error)' }}>{editingExpenseId ? 'Edit expense' : 'New expense'}</p><h2>{editingExpenseId ? 'Update expense' : 'Record an expense'}</h2></div><span className="required-note">* Required</span></div>
              <div className="form-grid">
                <label className={expenseErrors.description ? 'field invalid' : 'field'} style={{ gridColumn: '1 / -1' }}><span>Description / Details <em>*</em></span><input value={expenseForm.description} onChange={e => updateExpenseField('description', e.target.value)} placeholder="e.g. Decoration materials, Mandap rent" />{expenseErrors.description && <small>{expenseErrors.description}</small>}</label>
                <label className={expenseErrors.amount ? 'field invalid amount-field' : 'field amount-field'}><span>Amount <em>*</em></span><div className="amount-input"><span>Rs.</span><input type="number" min="1" step="0.01" value={expenseForm.amount} onChange={e => updateExpenseField('amount', e.target.value)} placeholder="0.00" /></div>{expenseErrors.amount && <small>{expenseErrors.amount}</small>}</label>
                <label className={expenseErrors.date ? 'field invalid' : 'field'}><span>Date <em>*</em></span><div className="date-input"><CalendarDays /><input type="date" value={expenseForm.date} onChange={e => updateExpenseField('date', e.target.value)} /></div>{expenseErrors.date && <small>{expenseErrors.date}</small>}</label>
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

      {activeTab === 'receipts' && (
        <section className="history-section">
          <div className="section-heading"><div><p className="eyebrow">Your records</p><h2>Receipt History</h2></div><span className="receipt-count">{receipts.length} total</span></div>
          {receipts.length === 0 ? <div className="empty-state"><ReceiptText /><p>No receipts yet</p><span>Your saved receipts will appear here.</span></div>
            : <div className="receipt-list">{receipts.map(receipt => <div className="receipt-row" key={receipt.id}><button className="receipt-row-main-button" onClick={() => setSelectedReceipt(receipt)}><span className="receipt-row-mark"><ReceiptText /></span><span className="receipt-row-main"><strong>Receipt #{receipt.receiptNo}</strong><small>House / donor {receipt.houseNo} · {formatDate(receipt.date)}</small></span><span className="payment-badge">{receipt.paymentMethod}</span><strong className="row-amount">{formatMoney(receipt.amount)}</strong></button><div className="row-actions"><button onClick={() => editReceiptRow(receipt)}><Edit3 /></button><button onClick={() => handleDeleteReceipt(receipt.id)}><Trash2 /></button></div></div>)}</div>}
        </section>
      )}

      {activeTab === 'expenses' && (
        <section className="history-section">
          <div className="section-heading"><div><p className="eyebrow" style={{ color: 'var(--error)' }}>Your records</p><h2>Expense History</h2></div><span className="receipt-count">{expenses.length} total</span></div>
          {expenses.length === 0 ? <div className="empty-state"><Wallet /><p>No expenses yet</p><span>Your recorded expenses will appear here.</span></div>
            : <div className="receipt-list">{expenses.map(expense => <div className="receipt-row" key={expense.id}><div className="receipt-row-main-button" style={{ cursor: 'default' }}><span className="receipt-row-mark" style={{ background: 'var(--error-muted)', color: 'var(--error)' }}><AlignLeft /></span><span className="receipt-row-main"><strong>{expense.description}</strong><small>{formatDate(expense.date)}</small></span><strong className="row-amount" style={{ color: 'var(--error)' }}>- {formatMoney(expense.amount)}</strong></div><div className="row-actions"><button onClick={() => editExpenseRow(expense)}><Edit3 /></button><button onClick={() => handleDeleteExpense(expense.id)}><Trash2 /></button></div></div>)}</div>}
        </section>
      )}
    </div>

    {selectedReceipt && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedReceipt(null) }}>
      <section className="receipt-modal" role="dialog" aria-modal="true">
        <button className="close-modal" onClick={() => setSelectedReceipt(null)}><X /></button>
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
