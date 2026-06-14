
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
    }
}
export type AppLocale = typeof en  // ← infer the shape from English
export default en
