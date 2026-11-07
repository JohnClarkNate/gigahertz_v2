import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent, MouseEvent } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { getInventorySpecifications, InventoryProduct, updateInventoryProduct } from '../data/inventory'

const steps = ['Basic info', 'Pricing', 'Inventory', 'Identification', 'Specifications', 'Review']
const fieldsByCategory: Record<string, string[]> = {
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

type EditDraft = {
  name: string
  brand: string
  model: string
  cost: string
  price: string
  reorderLevel: string
  posVisible: boolean
  specifications: Record<string, string>
}

export function EditInventoryProductWizard({ product, onClose, onSaved }: { product: InventoryProduct; onClose: () => void; onSaved: (product: InventoryProduct) => void }) {
  const brandDefault = product.brand ?? product.name.split(' ')[0]
  const modelDefault = product.model ?? product.name.slice(brandDefault.length).trim()
  const specDefault = product.specifications ?? Object.fromEntries(getInventorySpecifications(product))
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<EditDraft>(() => ({
    name: product.name,
    brand: brandDefault,
    model: modelDefault,
    cost: String(product.cost),
    price: String(product.price),
    reorderLevel: String(product.reorderLevel),
    posVisible: product.posVisible,
    specifications: { ...specDefault },
  }))
  const [error, setError] = useState('')
  const [invalidFields, setInvalidFields] = useState<string[]>([])
  const [shakingFields, setShakingFields] = useState<string[]>([])
  const [outsideShake, setOutsideShake] = useState(false)
  const [saving, setSaving] = useState(false)
  const specificationFields = useMemo(() => fieldsByCategory[product.category] ?? Object.keys(draft.specifications), [product.category, draft.specifications])
  const trackedUnits = product.tracksUnits ?? true
  const serialNumbers = product.serialNumbers ?? []

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const setValue = <K extends keyof EditDraft>(key: K, value: EditDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
    setInvalidFields((current) => current.filter((field) => field !== key && !(field === 'margin' && (key === 'cost' || key === 'price'))))
  }
  const updateText = (key: 'name' | 'brand' | 'model' | 'cost' | 'price' | 'reorderLevel') => (event: ChangeEvent<HTMLInputElement>) => setValue(key, event.target.value)
  const updateSpecs = (field: string, value: string) => {
    setDraft((current) => ({ ...current, specifications: { ...current.specifications, [field]: value } }))
    setInvalidFields((current) => current.filter((id) => id !== `spec:${field}`))
    setError('')
  }

  const validate = (target: number) => {
    if (target === 0 && (!draft.name.trim() || !draft.brand.trim() || !draft.model.trim())) return { message: 'Complete all product information fields.', fields: ['name', 'brand', 'model'].filter((key) => !draft[key as 'name' | 'brand' | 'model'].trim()) }
    if (target === 1) {
      const cost = Number(draft.cost), price = Number(draft.price)
      const invalid = [!draft.cost || !Number.isFinite(cost) || cost <= 0 ? 'cost' : '', !draft.price || !Number.isFinite(price) || price <= 0 ? 'price' : ''].filter(Boolean)
      if (invalid.length) return { message: 'Enter a valid cost and selling price.', fields: invalid }
      if ((price - cost) / price * 100 <= 0) return { message: 'Fix pricing input. Margin must be above 0%.', fields: ['margin'] }
    }
    if (target === 2 && (!draft.reorderLevel || !Number.isInteger(Number(draft.reorderLevel)) || Number(draft.reorderLevel) < 0)) return { message: 'Enter a valid reorder level.', fields: ['reorderLevel'] }
    if (target === 4) {
      const invalid = specificationFields.filter((field) => !draft.specifications[field]?.trim()).map((field) => `spec:${field}`)
      if (invalid.length) return { message: 'Complete all product specifications.', fields: invalid }
    }
    return { message: '', fields: [] as string[] }
  }

  const shake = (fields: string[]) => {
    setShakingFields([])
    window.requestAnimationFrame(() => setShakingFields(fields))
    window.setTimeout(() => setShakingFields([]), 600)
  }
  const navigate = (target: number) => {
    if (target > step) {
      for (let index = 0; index < target; index += 1) {
        const result = validate(index)
        if (result.message) {
          setStep(index); setError(result.message); setInvalidFields(result.fields); shake(result.fields)
          return
        }
      }
    }
    setStep(target); setError(''); setInvalidFields([])
  }
  const continueStep = () => {
    const result = validate(step)
    if (result.message) { setError(result.message); setInvalidFields(result.fields); shake(result.fields); return }
    navigate(Math.min(5, step + 1))
  }
  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    setOutsideShake(false)
    window.requestAnimationFrame(() => setOutsideShake(true))
    window.setTimeout(() => setOutsideShake(false), 500)
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    for (let index = 0; index < 5; index += 1) {
      const result = validate(index)
      if (result.message) { setStep(index); setError(result.message); setInvalidFields(result.fields); shake(result.fields); return }
    }
    setSaving(true); setError('')
    try {
      onSaved(await updateInventoryProduct(product.sku, {
        name: draft.name.trim(), brand: draft.brand.trim(), model: draft.model.trim(),
        cost: Number(draft.cost), price: Number(draft.price), reorderLevel: Number(draft.reorderLevel),
        posVisible: draft.posVisible, specifications: draft.specifications,
      }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Product could not be updated.')
    } finally { setSaving(false) }
  }

  const margin = Number(draft.price) > 0 && draft.cost !== '' ? (Number(draft.price) - Number(draft.cost)) / Number(draft.price) * 100 : null
  const renderStep = () => {
    if (step === 0) return <div className="add-form-grid">
      <EditField label="Product name" id="name" invalid={invalidFields.includes('name')} shake={shakingFields.includes('name')} className="add-span-two"><input required value={draft.name} onChange={updateText('name')} /></EditField>
      <EditField label="SKU" locked><input value={product.sku} disabled /></EditField>
      <EditField label="Category" locked className="add-select-field"><select value={product.category} disabled><option>{product.category}</option></select><ChevronDown size={13} /></EditField>
      <EditField label="Brand" id="brand" invalid={invalidFields.includes('brand')} shake={shakingFields.includes('brand')}><input required value={draft.brand} onChange={updateText('brand')} /></EditField>
      <EditField label="Model" id="model" invalid={invalidFields.includes('model')} shake={shakingFields.includes('model')}><input required value={draft.model} onChange={updateText('model')} /></EditField>
    </div>
    if (step === 1) return <><div className="add-form-grid">
      <EditField label="Unit cost (₱)" id="cost" invalid={invalidFields.includes('cost')} shake={shakingFields.includes('cost')}><input required type="number" min="0" step="0.01" value={draft.cost} onChange={updateText('cost')} /></EditField>
      <EditField label="Selling price (₱)" id="price" invalid={invalidFields.includes('price')} shake={shakingFields.includes('price')}><input required type="number" min="0" step="0.01" value={draft.price} onChange={updateText('price')} /></EditField>
    </div><p className={`add-margin-line ${invalidFields.includes('margin') && margin !== null && margin <= 0 ? 'invalid' : ''} ${shakingFields.includes('margin') ? 'shake' : ''}`}>Margin <strong>{margin === null ? '—' : `${margin.toFixed(1)}%`}</strong></p></>
    if (step === 2) return <div className="add-form-grid add-inventory-fields">
      <EditField label="Reorder level" id="reorderLevel" invalid={invalidFields.includes('reorderLevel')} shake={shakingFields.includes('reorderLevel')}><input required type="number" min="0" step="1" value={draft.reorderLevel} onChange={updateText('reorderLevel')} /></EditField>
      <EditField label="Available units" locked><input value={String(product.quantity)} disabled /></EditField>
      <EditField label="Defective units" locked><input value={String(product.defective)} disabled /></EditField>
      <p className="add-inline-helper">Stock quantities are managed through Manage Units.</p>
      <button type="button" className={`add-pos-card ${draft.posVisible ? 'selected' : ''}`} onClick={() => setValue('posVisible', !draft.posVisible)}><span><strong>Visible on POS</strong><small>Cashiers can find and sell this product.</small></span><i className={draft.posVisible ? 'on' : ''}><b /></i></button>
    </div>
    if (step === 3) return <div className="add-form-grid">
      <EditField label="Unit tracking" locked><input value={trackedUnits ? 'Individual units' : 'Quantity only'} disabled /></EditField>
      <EditField label="Identifier type" locked><input value={product.identifierType ?? (trackedUnits ? 'Serial Number' : 'Not applicable')} disabled /></EditField>
      <EditField label="Existing serial numbers" locked className="add-full"><textarea className="add-serial-input" value={serialNumbers.length ? serialNumbers.join('\n') : 'No serial numbers recorded in this mock item.'} disabled /></EditField>
    </div>
    if (step === 4) return <div className="add-specifications"><p>Specifications are specific to the locked {product.category} category.</p><div className="add-form-grid">{specificationFields.map((field) => <EditField key={field} label={field} id={`spec:${field}`} invalid={invalidFields.includes(`spec:${field}`)} shake={shakingFields.includes(`spec:${field}`)}><input required value={draft.specifications[field] ?? ''} onChange={(event) => updateSpecs(field, event.target.value)} /></EditField>)}</div></div>
    const rows = [
      ['Product', draft.name], ['SKU', product.sku], ['Category', product.category], ['Brand / Model', `${draft.brand} · ${draft.model}`],
      ['Cost / Selling price', `₱${Number(draft.cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })} / ₱${Number(draft.price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`],
      ['Margin', margin === null ? '—' : `${margin.toFixed(1)}%`], ['Available / Defective', `${product.quantity} / ${product.defective} units`],
      ['Reorder level', `${draft.reorderLevel} units`], ['POS', draft.posVisible ? 'Visible' : 'Hidden'],
      ['Specifications', specificationFields.map((field) => `${field}: ${draft.specifications[field] || '—'}`).join(' · ') || '—'],
    ]
    return <div className="add-review">{rows.map(([label, value]) => <div className="add-review-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
  }

  return <div className="add-wizard-backdrop" onMouseDown={handleBackdrop}>
    <form className={`add-wizard add-step-${step + 1} ${outsideShake ? 'outside-shake' : ''}`} onSubmit={submit} noValidate>
      <header className="add-wizard-header"><div><h2>Edit product</h2><p>Step {step + 1} of 6 · {steps[step]}</p></div><button type="button" aria-label="Close edit product" onClick={onClose}><X size={16} /></button></header>
      <div className="add-wizard-body"><nav className="add-stepper" aria-label="Edit product steps">{steps.map((label, index) => {
        const complete = index !== step && validate(index).message === ''
        return <button type="button" key={label} className={`${index === step ? 'active' : ''} ${complete ? 'complete' : ''}`} aria-current={index === step ? 'step' : undefined} onClick={() => navigate(index)}><span>{complete ? <Check size={11} strokeWidth={3} /> : index + 1}</span>{label}</button>
      })}</nav><div className="add-step-content">{renderStep()}{error && <p className="add-wizard-error" role="alert">{error}</p>}</div></div>
      <footer className="add-wizard-footer">{step > 0 && <button className="add-back-button" type="button" onClick={() => { setError(''); setStep((current) => current - 1) }}>Back</button>}{step === 0 && <button className="add-cancel-button" type="button" onClick={onClose}>Cancel</button>}{step < 5 ? <button className="add-continue-button" type="button" onClick={continueStep}>Continue</button> : <button className="add-continue-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>}</footer>
    </form>
  </div>
}

function EditField({ label, id, className = '', invalid = false, shake = false, locked = false, children }: { label: string; id?: string; className?: string; invalid?: boolean; shake?: boolean; locked?: boolean; children: React.ReactNode }) {
  return <label className={`add-field ${className} ${invalid ? 'invalid' : ''} ${shake ? 'shake' : ''} ${locked ? 'add-field-locked' : ''}`} data-field={id}><span>{label}{locked ? ' · Read only' : ''}</span>{children}</label>
}