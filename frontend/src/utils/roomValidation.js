export const ROOM_CONSTRAINTS = {
  name: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9\s-_]+$/, // Only letters, numbers, spaces, hyphens, and underscores
  },
  description: {
    maxLength: 200,
  },
  maxMembers: {
    min: 1,
    max: 50,
  },
};

export const validateRoomName = (name) => {
  if (!name) {
    return { isValid: false, error: "Room name is required" };
  }
  if (name.length < ROOM_CONSTRAINTS.name.minLength) {
    return {
      isValid: false,
      error: `Room name must be at least ${ROOM_CONSTRAINTS.name.minLength} characters long`,
    };
  }
  if (name.length > ROOM_CONSTRAINTS.name.maxLength) {
    return {
      isValid: false,
      error: `Room name must be less than ${ROOM_CONSTRAINTS.name.maxLength} characters`,
    };
  }
  if (!ROOM_CONSTRAINTS.name.pattern.test(name)) {
    return {
      isValid: false,
      error: "Room name can only contain letters, numbers, spaces, hyphens, and underscores",
    };
  }
  return { isValid: true };
};

export const validateRoomDescription = (description) => {
  if (!description) {
    return { isValid: true }; // Description is optional
  }
  if (description.length > ROOM_CONSTRAINTS.description.maxLength) {
    return {
      isValid: false,
      error: `Description must be less than ${ROOM_CONSTRAINTS.description.maxLength} characters`,
    };
  }
  return { isValid: true };
};

export const validateMaxMembers = (maxMembers) => {
  const num = Number(maxMembers);
  if (isNaN(num)) {
    return { isValid: false, error: "Max members must be a number" };
  }
  if (num < ROOM_CONSTRAINTS.maxMembers.min) {
    return {
      isValid: false,
      error: `Max members must be at least ${ROOM_CONSTRAINTS.maxMembers.min}`,
    };
  }
  if (num > ROOM_CONSTRAINTS.maxMembers.max) {
    return {
      isValid: false,
      error: `Max members cannot exceed ${ROOM_CONSTRAINTS.maxMembers.max}`,
    };
  }
  return { isValid: true };
};

export const validateRoomData = (formData) => {
  const nameValidation = validateRoomName(formData.name);
  const descriptionValidation = validateRoomDescription(formData.description);
  const maxMembersValidation = validateMaxMembers(formData.maxMembers);

  const errors = {};
  if (!nameValidation.isValid) errors.name = nameValidation.error;
  if (!descriptionValidation.isValid) errors.description = descriptionValidation.error;
  if (!maxMembersValidation.isValid) errors.maxMembers = maxMembersValidation.error;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}; 