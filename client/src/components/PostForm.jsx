import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  'General',
  'Technology',
  'Lifestyle',
  'Education',
  'Business',
  'Science',
  'Design',
  'Health'
];

const PostForm = ({
  initialValues = { title: '', content: '', category: 'General', image: '' },
  onSubmit,
  isEditing = false,
  isLoading = false,
  serverError = null
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: initialValues.title || '',
    content: initialValues.content || '',
    category: initialValues.category || 'General',
    image: initialValues.image || ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (initialValues) {
      setFormData({
        title: initialValues.title || '',
        content: initialValues.content || '',
        category: initialValues.category || 'General',
        image: initialValues.image || ''
      });
    }
  }, [initialValues]);

  const validate = () => {
    const errs = {};
    const trimmedTitle = formData.title.trim();
    const trimmedContent = formData.content.trim();

    if (!trimmedTitle) {
      errs.title = 'Title is required';
    } else if (trimmedTitle.length < 3) {
      errs.title = 'Title must be at least 3 characters';
    } else if (trimmedTitle.length > 200) {
      errs.title = 'Title cannot exceed 200 characters';
    }

    if (!trimmedContent) {
      errs.content = 'Content is required';
    } else if (trimmedContent.length < 5) {
      errs.content = 'Content must be at least 5 characters';
    }

    if (formData.image && formData.image.trim()) {
      try {
        new URL(formData.image.trim());
      } catch (_) {
        errs.image = 'Please enter a valid URL (e.g. https://example.com/image.jpg)';
      }
    }

    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const validationErrors = validate();
    if (validationErrors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validationErrors[name] }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ title: true, content: true, category: true, image: true });
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        image: formData.image.trim()
      });
    }
  };

  return (
    <form className="post-form" onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="alert alert-danger" role="alert">
          {serverError}
        </div>
      )}

      <div className="form-group">
        <div className="form-label-row">
          <label htmlFor="post-title" className="form-label">
            Post Title <span className="required-star">*</span>
          </label>
          <span className="char-count">
            {formData.title.length}/200
          </span>
        </div>
        <input
          id="post-title"
          name="title"
          type="text"
          className={`form-input ${errors.title ? 'input-error' : ''}`}
          placeholder="Give your post an engaging title..."
          value={formData.title}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={200}
          disabled={isLoading}
          required
        />
        {errors.title && <span className="error-text">{errors.title}</span>}
      </div>

      <div className="form-row-two-col">
        <div className="form-group">
          <label htmlFor="post-category" className="form-label">
            Category
          </label>
          <select
            id="post-category"
            name="category"
            className="form-select"
            value={formData.category}
            onChange={handleChange}
            disabled={isLoading}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="post-image" className="form-label">
            Cover Image URL <span className="optional-tag">(Optional)</span>
          </label>
          <input
            id="post-image"
            name="image"
            type="url"
            className={`form-input ${errors.image ? 'input-error' : ''}`}
            placeholder="https://example.com/cover.jpg"
            value={formData.image}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
          />
          {errors.image && <span className="error-text">{errors.image}</span>}
        </div>
      </div>

      {formData.image && !errors.image && (
        <div className="image-preview-box">
          <span className="preview-label">Image Preview:</span>
          <img
            src={formData.image}
            alt="Preview"
            className="image-preview-thumbnail"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="form-group">
        <div className="form-label-row">
          <label htmlFor="post-content" className="form-label">
            Post Content <span className="required-star">*</span>
          </label>
          <span className="char-count">
            {formData.content.length} characters
          </span>
        </div>
        <textarea
          id="post-content"
          name="content"
          rows={10}
          className={`form-textarea ${errors.content ? 'input-error' : ''}`}
          placeholder="Write your article, thoughts, or story here..."
          value={formData.content}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          required
        />
        {errors.content && <span className="error-text">{errors.content}</span>}
      </div>

      <div className="form-actions-row">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate(-1)}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="spinner-wrap">
              <span className="btn-spinner"></span>
              {isEditing ? 'Updating...' : 'Publishing...'}
            </span>
          ) : isEditing ? (
            'Save Changes'
          ) : (
            'Publish Post'
          )}
        </button>
      </div>
    </form>
  );
};

export default PostForm;

