
export const en = {
    common: {
        loading: 'Loading…',
        error: 'Something went wrong.',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        confirm: 'Confirm',
        back: 'Back',
        search: 'Search',
    },
    auth: {
        login: {
            heading: 'Welcome back.',
            sub: 'Sign in to your account.',
            email: 'Email',
            password: 'Password',
            submit: 'Sign in →',
            submitting: 'Signing in…',
            error: {
                empty: 'Please enter your email and password.',
                failed: 'Login failed. Please try again.',
            }
        },
        logout: 'Sign out',
    },
    booking: {
        title: 'My Bookings',
        create: 'New Booking',
        delete: 'Cancel Booking',
        empty: 'No bookings found.',
        fields: {
            room: 'Room',
            date: 'Date',
            time: 'Time',
            usage: 'Usage',
        }
    },
    room: {
        title: 'Rooms',
        create: 'Add Room',
        edit: 'Edit Room',
        delete: 'Delete Room',
        empty: 'No rooms found.',
        fields: {
            name: 'Name',
            floor: 'Floor',
            roomNumber: 'Room Number',
        }
    },
    staff: {
        dashboard: 'Staff Dashboard',
        bookings: 'All Bookings',
        rooms: 'Manage Rooms',
    },
    user: {
        dashboard: 'My Dashboard',
        bookings: 'My Bookings',
    },
    errors: {
        InternalServerError: 'An unexpected error occurred. Please try again.',
        InvalidFileError: 'The file is invalid.',
        DatabaseNotAcknowledged: 'The database did not acknowledge the write. Please try again.',
        UserDoesNotExist: 'This user does not exist or is unreachable.',
        PasswordError: 'Password is too weak.',
        UserInvalidType: 'This user type is not valid for this operation.',
        UserIncorrectPasswordError: 'The password you entered is incorrect.',
        TokenStillValidError: 'Your existing session is still valid.',
        EmailAlreadyUsed: 'A user with this email address already exists.',
        RoleDoesNotExist: 'This role does not exist.',
        InvalidRoleSpecification: 'The requested role is not valid.',
        UserRequestPasswordTokenAltreadyExists: 'A password reset request is already in progress.',
        SendEmailError: 'An error occurred while sending the email.',
        InvalidBase64Image: 'The image is not valid.',
        UserInvalidState: 'This user is already active.',
        UserResetPasswordParamsMissingError: 'Required information for resetting the password is missing.',
        RequestDataInvalidError: 'The submitted data is invalid.',
        UserInvalidError: 'This user does not exist or is invalid.',
        DownloadExcellError: 'The Excel file could not be downloaded.',
        ParseExcellRowToUserError: 'A row in the Excel file could not be processed.',
        InvalidTimeSlot: 'The selected day or time is not valid.',
        BookingLimitPerDayExeeded: 'You have reached the maximum booking time allowed for this day.',
        BookingExistsForThatTimeError: 'You already have a booking for that day and time.',
        BookingOverlapsError: 'This time overlaps with an existing booking.',
        BookingInvalidError: 'This booking does not exist or is unreachable.',
        DBError: 'A database error occurred. Please try again.',
        RoomInvalidError: 'This room does not exist or is unreachable.',
        RoomAlreadyExistsError: 'A room with this name or number already exists.',
        DuplicateDayScheduleError: 'A schedule for this day already exists.',
        ParseEmailError: 'An error occurred while processing the email.',
        BookingsExistError: 'This room has upcoming bookings and cannot be deleted.',
        ActivityNotFoundError: 'This activity does not exist or is invalid.',
        Unauthorized: 'Your session has expired. Please sign in again.',
        Forbidden: "You don't have permission to perform this action.",
        NotFound: 'The requested resource was not found.',
        NetworkError: 'Could not reach the server. Please check your connection.',
        BookingInvalidDeletionError: 'This booking has already passed and cannot be deleted.',

        Unknown: 'Something went wrong. Please try again.',
    },
}

export type AppLocale = typeof en  // ← infer the shape from English
export default en
