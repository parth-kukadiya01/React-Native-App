# End-to-End Icon Requirements

The SV GOLD application exclusively uses MaterialIcons from react-native-vector-icons. While MaterialCommunityIcons is imported in some files, it is currently unused.

Below is the complete, categorized list of all Material Icons required across the application (both in src/ and app/).

## 1. Primary Navigation & Actions
These icons are used for top-level navigation, tab bars, headers, and primary screen actions.
- home
- grid-view (or category)
- favorite / favorite-border
- person
- shopping-bag
- search
- notifications-none
- tune (For Filters)

## 2. General UI & Controls
Used within screens for lists, returning backwards, expanding menus, and confirming actions.
- arrow-back-ios
- arrow-forward-ios
- chevron-right
- keyboard-arrow-up
- refresh
- close
- check
- check-circle
- add
- remove
- edit
- delete-outline
- swap-horiz

## 3. Order & Inventory Management
Icons directly related to products, scanning, stock, and receipts.
- inventory-2
- receipt-long
- local-shipping

## 4. Authentication, Security & User Profile
Used in Login, Register, Forgot Password, and Profile screens.
- security
- vpn-key
- lock
- lock-outline
- lock-reset
- visibility
- visibility-off
- email / alternate-email
- contact-mail
- smartphone
- verified / verified-user
- business
- storefront
- add-a-photo
- logout

## 5. Support & Feedback
Used for displaying info, errors, and contacting support.
- error-outline
- info-outline
- support-agent
- whatsapp
- star / star-border

## 6. Dynamic Icons
In multiple places, the app resolves the icon name dynamically:
- **Order Status:** For example, processing, shipped, or delivered states will inject dynamic MaterialIcons strings (like local-shipping, check-circle, inventory-2).
- **Notifications:** The icon type in the Notifications screen is completely dependent on the notification category (e.g., promotional, order update).

**Note:** Whenever adding or customizing icons, ensure they are available within the standard MaterialIcons glyph map of react-native-vector-icons.
