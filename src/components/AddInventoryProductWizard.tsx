import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent, MouseEvent } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { addInventoryProduct, InventoryProduct, NewInventoryProduct } from '../data/inventory'

const steps = ['Basic info', 'Pricing', 'Inventory', 'Identification', 'Specifications', 'Review']
const categories = ['CPU', 'GPU', 'RAM', 'Storage', 'Motherboard', 'Peripherals', 'Accessories', 'Power Supply', 'Cooling']
const specsByCategory: Record<string, string[]> = {
  RAM: ['Capacity', 'Generation', 'Speed', 'Form factor'],
  GPU: ['VRAM', 'Memory type', 'Interface', 'Length'],
  Storage: ['Capacity', 'Interface', 'Form factor', 'Read speed'],
  CPU: ['Cores / threads', 'Socket', 'Base clock', 'Boost clock'],
  Motherboard: ['Socket', 'Chipset', 'Form factor', 'Memory type'],
  Peripherals: ['Connection', 'Color', 'Compatibility'],
  Accessories: ['Type', 'Length', 'Compatibility'],
  'Power Supply': ['Wattage', 'Efficiency', 'Modularity'],
  Cooling: ['Cooler type', 'Fan size', 'Compatibility'],
}

type Draft = {
  name: string
  sku: string
  category: string
  brand: string
  model: string
  cost: string
  price: string
  reorderLevel: string
  posVisible: boolean
  tracksUnits: boolean
  identifierType: string
  serialText: string
  quantity: string
  specifications: Record<string, string>
}

const emptyDraft: Draft = {
  name: '', sku: '', category: '', brand: '', model: '', cost: '', price: '',
  reorderLevel: '2', posVisible: true, tracksUnits: true, identifierType: 'Serial Number',
  serialText: '', quantity: '0', specifications: {},
}

export function AddInventoryProductWizard({ onClose, onSaved }: { onClose: () => void; onSaved: (product: InventoryProduct) => void }) {
  const [step, setStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => new Set([0]))
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [error, setError] = useState('')
  const [shakingFields, setShakingFields] = useState<string[]>([])
  const [invalidFields, setInvalidFields] = useState<string[]>([])
  const [outsideShake, setOutsideShake] = useState(false)
  const [saving, setSaving] = useState(false)
  const serialNumbers = useMemo(() => draft.serialText.split(/[\n,]+/).map((serial) => serial.trim()).filter(Boolean), [draft.serialText])
  const specificationFields = specsByCategory[draft.category] ?? []

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const change = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
    setInvalidFields((fields) => fields.filter((field) => field !== key && !(key === 'serialText' && field === 'serialNumbers') && !(field === 'margin' && (key === 'cost' || key === 'price')) && !(key === 'category' && field.startsWith('spec:'))))
  }
  const updateText = (key: keyof Draft) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => change(key, event.target.value as never)

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    setOutsideShake(false)
    window.requestAnimationFrame(() => setOutsideShake(true))
    window.setTimeout(() => setOutsideShake(false), 500)
  }

  const validateStep = (stepToValidate: number): { message: string; fields: string[] } => {
    if (stepToValidate === 0) {
      const fields = (['name', 'sku', 'category', 'brand', 'model'] as const).filter((key) => !draft[key].trim())
      if (fields.length) return { message: 'Complete all product information fields.', fields }
    }
    if (stepToValidate === 1) {
      const cost = Number(draft.cost), price = Number(draft.price)
      const fields = [
        ...(!draft.cost || !Number.isFinite(cost) || cost <= 0 ? ['cost'] : []),
        ...(!draft.price || !Number.isFinite(price) || price <= 0 ? ['price'] : []),
      ]
      if (fields.length) return { message: 'Enter a valid cost and selling price.', fields }
      const margin = (price - cost) / price * 100
      if (margin <= 0) return { message: 'Fix pricing input. Margin must be above 0%.', fields: ['margin'] }
    }
    if (stepToValidate === 2 && (!draft.reorderLevel || !Number.isInteger(Number(draft.reorderLevel)) || Number(draft.reorderLevel) < 0)) return { message: 'Enter a valid reorder level.', fields: ['reorderLevel'] }
    if (stepToValidate === 3) {
      if (draft.tracksUnits && serialNumbers.length === 0) return { message: 'Add at least one serial number, or choose quantity only.', fields: ['serialNumbers'] }
      if (!draft.tracksUnits && (!draft.quantity || !Number.isInteger(Number(draft.quantity)) || Number(draft.quantity) < 0)) return { message: 'Enter a valid initial quantity.', fields: ['quantity'] }
      if (draft.tracksUnits && new Set(serialNumbers.map((serial) => serial.toLowerCase())).size !== serialNumbers.length) return { message: 'Serial numbers must be unique.', fields: ['serialNumbers'] }
    }
    if (stepToValidate === 4) {
      const fields = specificationFields.filter((field) => !draft.specifications[field]?.trim()).map((field) => `spec:${field}`)
      if (fields.length) return { message: 'Complete all product specifications.', fields }
    }
    return { message: '', fields: [] }
  }

  const shake = (fields: string[]) => {
    setShakingFields([])
    window.requestAnimationFrame(() => setShakingFields(fields))
    window.setTimeout(() => setShakingFields([]), 600)
  }

  const navigateToStep = (target: number) => {
    if (target > step) {
      for (let index = 0; index < target; index += 1) {
        const validation = validateStep(index)
        if (validation.message) {
          setStep(index)
          setVisitedSteps((visited) => new Set(visited).add(index))
          setError(validation.message)
          setInvalidFields(validation.fields)
          shake(validation.fields)
          return
        }
      }
    }
    setError('')
    setInvalidFields([])
    setStep(target)
    setVisitedSteps((visited) => new Set(visited).add(target))
  }

  const continueStep = () => {
    const validation = validateStep(step)
    if (validation.message) {
      setError(validation.message)
      setInvalidFields(validation.fields)
      shake(validation.fields)
      return
    }
    setInvalidFields([])
    navigateToStep(Math.min(5, step + 1))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    for (let index = 0; index < 5; index += 1) {
      const validation = validateStep(index)
      if (validation.message) {
        setError(validation.message)
        setInvalidFields(validation.fields)
        setStep(index)
        setVisitedSteps((visited) => new Set(visited).add(index))
        shake(validation.fields)
        return
      }
    }
    const payload: NewInventoryProduct = {
      name: draft.name.trim(), sku: draft.sku.trim(), category: draft.category,
      brand: draft.brand.trim(), model: draft.model.trim(), cost: Number(draft.cost), price: Number(draft.price),
      reorderLevel: Number(draft.reorderLevel), posVisible: draft.posVisible, tracksUnits: draft.tracksUnits,
      identifierType: draft.tracksUnits ? draft.identifierType : undefined,
      serialNumbers: draft.tracksUnits ? serialNumbers : [],
      initialQuantity: draft.tracksUnits ? serialNumbers.length : Number(draft.quantity),
      specifications: draft.specifications,
    }
    setSaving(true); setError('')
    try { onSaved(await addInventoryProduct(payload)) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Product could not be saved.') }
    finally { setSaving(false) }
  }

  const renderStep = () => {
    if (step === 0) return <div className="add-form-grid">
      <Field label="Product name" fieldId="name" invalid={invalidFields.includes('name')} shake={shakingFields.includes('name')} className="add-span-two"><input autoFocus required value={draft.name} onChange={updateText('name')} /></Field>
      <Field label="SKU" fieldId="sku" invalid={invalidFields.includes('sku')} shake={shakingFields.includes('sku')}><input required value={draft.sku} onChange={updateText('sku')} /></Field>
      <Field label="Category" fieldId="category" invalid={invalidFields.includes('category')} shake={shakingFields.includes('category')} className="add-select-field"><select required value={draft.category} onChange={updateText('category')}><option value="">Select category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><ChevronDown size={13} /></Field>
      <Field label="Brand" fieldId="brand" invalid={invalidFields.includes('brand')} shake={shakingFields.includes('brand')}><input required value={draft.brand} onChange={updateText('brand')} /></Field>
      <Field label="Model" fieldId="model" invalid={invalidFields.includes('model')} shake={shakingFields.includes('model')}><input required value={draft.model} onChange={updateText('model')} /></Field>
    </div>
    if (step === 1) {
      const margin = Number(draft.price) > 0 && draft.cost !== '' ? ((Number(draft.price) - Number(draft.cost)) / Number(draft.price) * 100) : null
      const invalidMargin = invalidFields.includes('margin') && margin !== null && margin <= 0
      return <><div className="add-form-grid"><Field label="Unit cost (₱)" fieldId="cost" invalid={invalidFields.includes('cost')} shake={shakingFields.includes('cost')}><input required type="number" min="0" step="0.01" value={draft.cost} onChange={updateText('cost')} /></Field><Field label="Selling price (₱)" fieldId="price" invalid={invalidFields.includes('price')} shake={shakingFields.includes('price')}><input required type="number" min="0" step="0.01" value={draft.price} onChange={updateText('price')} /></Field></div><p className={`add-margin-line ${invalidMargin ? 'invalid' : ''} ${shakingFields.includes('margin') ? 'shake' : ''}`}>Margin <strong>{margin === null ? '—' : `${margin.toFixed(1)}%`}</strong></p></>
    }
    if (step === 2) return <div className="add-form-grid add-inventory-fields"><Field label="Reorder level" fieldId="reorderLevel" invalid={invalidFields.includes('reorderLevel')} shake={shakingFields.includes('reorderLevel')}><input required type="number" min="0" step="1" value={draft.reorderLevel} onChange={updateText('reorderLevel')} /></Field><p className="add-inline-helper">You’ll be alerted when available stock reaches this number.</p><button type="button" className={`add-pos-card ${draft.posVisible ? 'selected' : ''}`} onClick={() => change('posVisible', !draft.posVisible)}><span><strong>Visible on POS</strong><small>Cashiers can find and sell this product.</small></span><i className={draft.posVisible ? 'on' : ''}><b /></i></button></div>
    if (step === 3) return <div className="add-identification">
      <h3>Does this product require individual unit tracking?</h3>
      <div className="add-tracking-options"><button type="button" className={draft.tracksUnits ? 'selected' : ''} onClick={() => change('tracksUnits', true)}><strong>Yes, track each unit</strong><span>For items with serial numbers, IMEI, or asset tags — CPUs, GPUs, drives, RAM.</span></button><button type="button" className={!draft.tracksUnits ? 'selected' : ''} onClick={() => change('tracksUnits', false)}><strong>No, quantity only</strong><span>For low-value items without identifiers — cables, thermal paste, adapters.</span></button></div>
      {draft.tracksUnits ? <><Field label="Identifier type" className="add-full add-select-field"><select required value={draft.identifierType} onChange={updateText('identifierType')}><option>Serial Number</option><option>IMEI</option><option>Asset Tag</option></select><ChevronDown size={13} /></Field><div className="add-serial-label"><label>Serial Numbers</label><span>{serialNumbers.length} units · one per line or comma-separated</span></div><textarea required aria-label="Serial numbers" className={`add-serial-input ${invalidFields.includes('serialNumbers') ? 'invalid' : ''} ${shakingFields.includes('serialNumbers') ? 'shake' : ''}`} value={draft.serialText} onChange={updateText('serialText')} placeholder={'SN-0019283\nSN-0019284\nSN-0019285'} /><p className="add-serial-helper">Scan with a barcode reader, paste a list, or add units later. Initial quantity equals the number of identifiers.</p></> : <div className="add-form-grid add-quantity-only"><Field label="Initial quantity" fieldId="quantity" invalid={invalidFields.includes('quantity')} shake={shakingFields.includes('quantity')}><input required type="number" min="0" step="1" value={draft.quantity} onChange={updateText('quantity')} /></Field><p className="add-inline-helper">Units will be tracked by quantity without individual identifiers.</p></div>}
    </div>
    if (step === 4) return <div className="add-specifications"><p>Fields shown are specific to the {draft.category || 'product'} category.</p><div className="add-form-grid">{specificationFields.map((field) => <Field key={field} label={field} fieldId={`spec:${field}`} invalid={invalidFields.includes(`spec:${field}`)} shake={shakingFields.includes(`spec:${field}`)}><input required value={draft.specifications[field] ?? ''} onChange={(event) => { setInvalidFields((fields) => fields.filter((id) => id !== `spec:${field}`)); setError(''); change('specifications', { ...draft.specifications, [field]: event.target.value }) }} /></Field>)}</div></div>
    return <div className="add-review">{[
      ['Product', draft.name], ['SKU', draft.sku], ['Brand / Model', `${draft.brand} · ${draft.model}`], ['Category', draft.category],
      ['Cost / Price', `₱${Number(draft.cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })} / ₱${Number(draft.price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`],
      ['Tracking', draft.tracksUnits ? `Individual units · ${draft.identifierType}` : 'Quantity only'],
      ['Initial stock', `${draft.tracksUnits ? serialNumbers.length : Number(draft.quantity || 0)} units`],
      ['Reorder level', `${draft.reorderLevel || 0} units`], ['POS', draft.posVisible ? 'Visible' : 'Hidden'],
      ['Specifications', specificationFields.map((field) => `${field}: ${draft.specifications[field] || '—'}`).join(' · ') || '—'],
    ].map(([label, value]) => <div className="add-review-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
  }

  return <div className="add-wizard-backdrop" onMouseDown={handleBackdropMouseDown}>
    <form className={`add-wizard add-step-${step + 1} ${outsideShake ? 'outside-shake' : ''}`} onSubmit={submit} noValidate>
      <header className="add-wizard-header"><div><h2>Add product</h2><p>Step {step + 1} of 6 · {steps[step]}</p></div><button type="button" aria-label="Close add product" onClick={onClose}><X size={16} /></button></header>
      <div className="add-wizard-body">
        <nav className="add-stepper" aria-label="Add product steps">{steps.map((label, index) => {
          const complete = index !== step && visitedSteps.has(index) && validateStep(index).message === ''
          return <button type="button" key={label} className={`${index === step ? 'active' : ''} ${complete ? 'complete' : ''}`} aria-current={index === step ? 'step' : undefined} onClick={() => navigateToStep(index)}><span>{complete ? <Check size={11} strokeWidth={3} /> : index + 1}</span>{label}</button>
        })}</nav>
        <div className="add-step-content">{renderStep()}{error && <p className="add-wizard-error" role="alert">{error}</p>}</div>
      </div>
      <footer className="add-wizard-footer">{step > 0 && <button className="add-back-button" type="button" onClick={() => { setError(''); setStep((current) => current - 1) }}>Back</button>}{step === 0 && <button className="add-cancel-button" type="button" onClick={onClose}>Cancel</button>}{step < 5 ? <button className="add-continue-button" type="button" onClick={continueStep}>Continue</button> : <button className="add-continue-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>}</footer>
    </form>
  </div>
}

function Field({ label, className = '', fieldId, shake = false, invalid = false, children }: { label: string; className?: string; fieldId?: string; shake?: boolean; invalid?: boolean; children: React.ReactNode }) {
  return <label className={`add-field ${className} ${invalid ? 'invalid' : ''} ${shake ? 'shake' : ''}`} data-field={fieldId}><span>{label}</span>{children}</label>
}
