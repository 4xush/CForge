import { useState, useCallback } from 'react';

export const useForm = (initialValues = {}, validate) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setValues(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    }, [errors]);

    const handleBlur = useCallback((e) => {
        const { name } = e.target;
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));

        // Validate on blur if validation function is provided
        if (validate) {
            const validationErrors = validate(values);
            setErrors(prev => ({
                ...prev,
                [name]: validationErrors[name] || ''
            }));
        }
    }, [validate, values]);

    const setFieldValue = useCallback((name, value) => {
        setValues(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    const handleSubmit = useCallback(async (onSubmit) => {
        setIsSubmitting(true);
        setErrors({});

        try {
            if (validate) {
                const validationErrors = validate(values);
                if (Object.keys(validationErrors).length > 0) {
                    setErrors(validationErrors);
                    return;
                }
            }

            await onSubmit(values);
        } catch (error) {
            console.error('Form submission error:', error);
            setErrors(prev => ({
                ...prev,
                submit: error.message || 'An error occurred during submission'
            }));
        } finally {
            setIsSubmitting(false);
        }
    }, [validate, values]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
        resetForm,
        setValues
    };
}; 