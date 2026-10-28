import { useCallback, useEffect, useState } from 'react';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../../api/addresses';
import styles from './address.module.scss';

const emptyForm = {
  label: 'Home',
  full_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  postal_code: '',
  country: 'PH',
  delivery_instructions: '',
  is_default: false,
};

const formatAddress = (address) =>
  [address.line1, address.line2, address.city, address.postal_code, address.country]
    .filter(Boolean)
    .join(', ');

export default function Address() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeActionId, setActiveActionId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAddresses = useCallback(async () => {
    setError('');

    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (err) {
      setError(err.message || 'Failed to load addresses.');
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchAddresses = async () => {
      try {
        const data = await getAddresses();

        if (!ignore) {
          setAddresses(data);
          setError('');
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load addresses.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchAddresses();

    return () => {
      ignore = true;
    };
  }, []);

  const openAddForm = () => {
    setForm({
      ...emptyForm,
      is_default: addresses.length === 0,
    });
    setEditingId(null);
    setIsFormOpen(true);
    setError('');
    setNotice('');
  };

  const openEditForm = (address) => {
    setForm({
      label: address.label ?? 'Home',
      full_name: address.full_name ?? '',
      phone: address.phone ?? '',
      line1: address.line1 ?? '',
      line2: address.line2 ?? '',
      city: address.city ?? '',
      postal_code: address.postal_code ?? '',
      country: address.country ?? 'PH',
      delivery_instructions: address.delivery_instructions ?? '',
      is_default: Boolean(address.is_default),
    });

    setEditingId(address.id);
    setIsFormOpen(true);
    setError('');
    setNotice('');
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setNotice('');

    try {
      if (editingId !== null) {
        const result = await updateAddress(editingId, form);

        const updatedAddress = result.address;

        setAddresses((previous) =>
          previous.map((address) => {
            if (address.id === editingId) {
              return updatedAddress;
            }

            return form.is_default ? { ...address, is_default: false } : address;
          }),
        );

        setNotice('Address updated successfully.');
      } else {
        const result = await createAddress(form);

        setAddresses((previous) => {
          const current = form.is_default
            ? previous.map((address) => ({
                ...address,
                is_default: false,
              }))
            : previous;

          return [result.address, ...current];
        });

        setNotice('Address added successfully.');
      }

      closeForm();
      await loadAddresses();
    } catch (err) {
      setError(err.message || 'Failed to save address.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (address) => {
    setActiveActionId(address.id);
    setError('');
    setNotice('');

    try {
      await updateAddress(address.id, {
        is_default: true,
      });

      await loadAddresses();
      setNotice('Default address updated.');
    } catch (err) {
      setError(err.message || 'Failed to set default address.');
    } finally {
      setActiveActionId(null);
    }
  };

  const handleDelete = async (address) => {
    const confirmed = window.confirm(`Delete the address labeled "${address.label}"?`);

    if (!confirmed) return;

    setActiveActionId(address.id);
    setError('');
    setNotice('');

    try {
      await deleteAddress(address.id);
      setAddresses((previous) => previous.filter((item) => item.id !== address.id));
      setNotice('Address deleted successfully.');
      await loadAddresses();
    } catch (err) {
      setError(err.message || 'Failed to delete address.');
    } finally {
      setActiveActionId(null);
    }
  };

  if (isLoading) {
    return <main className={styles.page}>Loading addresses...</main>;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>My Addresses</h1>
          <p>Manage your delivery addresses.</p>
        </div>

        {!isFormOpen && (
          <button type="button" className={styles.primaryButton} onClick={openAddForm}>
            Add address
          </button>
        )}
      </header>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      {isFormOpen && (
        <section className={styles.formSection}>
          <h2>{editingId !== null ? 'Edit address' : 'Add a new address'}</h2>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Address label
              <select name="label" value={form.label} onChange={handleChange} required>
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Full name
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </label>

            <label>
              Phone number
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                required
              />
            </label>

            <label>
              Address line 1
              <input
                name="line1"
                value={form.line1}
                onChange={handleChange}
                placeholder="House number, street, barangay"
                autoComplete="address-line1"
                required
              />
            </label>

            <label>
              Address line 2 (optional)
              <input
                name="line2"
                value={form.line2}
                onChange={handleChange}
                placeholder="Unit, building, floor"
                autoComplete="address-line2"
              />
            </label>

            <label>
              City / Municipality
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                autoComplete="address-level2"
                required
              />
            </label>

            <label>
              Postal code
              <input
                name="postal_code"
                value={form.postal_code}
                onChange={handleChange}
                autoComplete="postal-code"
                required
              />
            </label>

            <label>
              Country code
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                maxLength={2}
                placeholder="PH"
                required
              />
            </label>

            <label className={styles.fullWidth}>
              Delivery instructions (optional)
              <textarea
                name="delivery_instructions"
                value={form.delivery_instructions}
                onChange={handleChange}
                placeholder="Landmarks or instructions for the courier"
                rows={3}
              />
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="is_default"
                checked={form.is_default}
                onChange={handleChange}
              />
              Set as my default address
            </label>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={closeForm}
                disabled={isSaving}>
                Cancel
              </button>

              <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                {isSaving ? 'Saving...' : editingId !== null ? 'Save changes' : 'Add address'}
              </button>
            </div>
          </form>
        </section>
      )}

      {!isFormOpen && addresses.length === 0 && (
        <section className={styles.emptyState}>
          <h2>No saved addresses</h2>
          <p>Add an address so it's ready for checkout.</p>
          <button type="button" className={styles.primaryButton} onClick={openAddForm}>
            Add your first address
          </button>
        </section>
      )}

      {!isFormOpen && addresses.length > 0 && (
        <section className={styles.addressList}>
          {addresses.map((address) => (
            <article key={address.id} className={styles.addressCard}>
              <div className={styles.cardHeader}>
                <div className={styles.addressTitle}>
                  <h2>{address.label}</h2>

                  {address.is_default && <span className={styles.defaultBadge}>Default</span>}
                </div>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => openEditForm(address)}>
                    Edit
                  </button>

                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => handleDelete(address)}
                    disabled={activeActionId === address.id}>
                    Delete
                  </button>
                </div>
              </div>

              <p className={styles.name}>{address.full_name}</p>
              <p>{address.phone}</p>
              <p>{formatAddress(address)}</p>

              {address.delivery_instructions && (
                <p className={styles.instructions}>Instructions: {address.delivery_instructions}</p>
              )}

              {!address.is_default && (
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => handleSetDefault(address)}
                  disabled={activeActionId === address.id}>
                  {activeActionId === address.id ? 'Updating...' : 'Set as default'}
                </button>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
