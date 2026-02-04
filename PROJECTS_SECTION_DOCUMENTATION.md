# Projects Section Documentation

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Main Pages](#main-pages)
4. [Tabs System](#tabs-system)
5. [Workflow Components](#workflow-components)
6. [UI Components](#ui-components)
7. [Data Flow](#data-flow)
8. [Key Features](#key-features)

---

## Overview

The Projects Section is a comprehensive feature that allows users to create, manage, and collaborate on product image generation projects. It provides a structured workflow for generating AI-powered product images with multiple customization options.

### What is the Projects Section?
The Projects Section enables users to:
- Create and manage multiple projects
- Follow a 5-step workflow to generate product images
- Collaborate with team members
- View project statistics and results
- Manage project settings and permissions

### Why Does It Exist?
- **Organization**: Helps users organize multiple product campaigns
- **Workflow Management**: Provides a structured process for image generation
- **Collaboration**: Enables team-based project management
- **Tracking**: Allows users to track project progress and results

---

## Project Structure

### Directory Layout
```
frontend/src/
├── app/dashboard/projects/
│   ├── page.js                    # Main projects listing page
│   ├── create/
│   │   └── page.js                # Create new project page
│   └── [slug]/
│       └── page.jsx                # Individual project detail page
│
└── components/project/
    ├── Header.jsx                  # Project header with actions
    ├── workflow-content.jsx        # Main tab container
    ├── workflow-steps.jsx         # Step navigation component
    │
    ├── tabs/
    │   ├── workflow-tab.jsx       # Main workflow tab
    │   ├── overview-tab.jsx       # Project overview tab
    │   ├── results-tab.jsx        # Results and history tab
    │   └── collaborators-tab.jsx  # Team collaboration tab
    │
    ├── brief-and-concept.jsx      # Step 1: Brief & Concept
    ├── themes-and-backgrounds.jsx # Step 2: Themes & Backgrounds
    ├── color-palette.jsx          # Step 2: Color Palette
    ├── global-instructions.jsx    # Step 2: Global Instructions
    ├── model-selection-section.jsx # Step 3: Model Selection
    ├── product-upload-page.jsx    # Step 4: Product Upload
    ├── generate-section.jsx        # Step 5: Generate Section
    ├── Image-grid.jsx              # Step 5: Image Grid Display
    │
    └── Supporting Components:
        ├── product-images-display.jsx      # Display and regenerate product images
        ├── InviteModal.jsx                 # Modal for inviting team members
        ├── hierarchical-ornament-select.jsx # Ornament type selector
        ├── generated-prompts-display.jsx   # Display generated prompts
        ├── selected-colors-display.jsx     # Display selected colors
        ├── stat-card.jsx                   # Statistics card component
        ├── model-usage-stats.jsx           # Model usage statistics
        └── results-section.jsx             # Results section component
```

---

## Main Pages

### 1. Projects Listing Page (`/dashboard/projects/page.js`)

**Location**: `frontend/src/app/dashboard/projects/page.js`

**Purpose**: Displays all user projects in a grid layout with filtering and search capabilities.

**Key Features**:
- **Search Functionality**: Filter projects by name
- **Tab Filtering**: Filter by status (All, In Progress, Completed)
- **Project Cards**: Display project information including:
  - Project name
  - Status badge (In Progress, Completed, Draft)
  - Image count
  - Last updated time
  - Collaborator avatars
- **Create New Project**: Link to create new project page
- **Delete Project**: Delete functionality with confirmation

**Components Used**:
- `Card`, `CardHeader`, `CardTitle`, `CardContent` from `@/components/ui/card`
- `Badge` from `@/components/ui/badge`
- `Avatar`, `AvatarImage`, `AvatarFallback` from `@/components/ui/avatar`
- `Button` from `@/components/ui/button`
- Icons from `lucide-react`: `Clock`, `FileText`, `CheckCircle`, `Zap`, `Search`, `Eye`, `Download`, `Plus`, `Trash2`, `Image`, `FolderKanban`, `MoreVertical`, `BarChart3`, `Users`

**State Management**:
- `projects`: Array of project objects
- `searchQuery`: Search filter string
- `activeTab`: Current filter tab ("All", "In Progress", "Completed")
- `loading`: Loading state
- `error`: Error state

**API Calls**:
- `apiService.getProjects(token)`: Fetch all projects
- `apiService.deleteProject(projectId, token)`: Delete a project

**How It Works**:
1. On mount, fetches all projects from API
2. Filters projects based on search query and active tab
3. Renders project cards with relevant information
4. Handles project deletion with confirmation

---

### 2. Create Project Page (`/dashboard/projects/create/page.js`)

**Location**: `frontend/src/app/dashboard/projects/create/page.js`

**Purpose**: Allows users to create a new project with name and description.

**Key Features**:
- **Project Name Input**: Required field
- **Description Textarea**: Required field
- **Form Validation**: Ensures both fields are filled
- **Navigation**: Redirects to project detail page after creation

**Components Used**:
- `Button` from `@/components/ui/button`
- Icons from `lucide-react`: `ChevronLeft`, `Loader2`

**State Management**:
- `projectName`: Project name string
- `description`: Project description string
- `loading`: Loading state
- `error`: Error state

**API Calls**:
- `apiService.createProject(projectData, token)`: Creates new project

**How It Works**:
1. User enters project name and description
2. Validates required fields
3. Calls API to create project
4. Redirects to project detail page using slug

---

### 3. Project Detail Page (`/dashboard/projects/[slug]/page.jsx`)

**Location**: `frontend/src/app/dashboard/projects/[slug]/page.jsx`

**Purpose**: Main project detail page that displays project header and workflow content.

**Key Features**:
- **Dynamic Routing**: Uses Next.js dynamic routing with slug
- **Project Loading**: Fetches project data by slug or ID
- **Role Management**: Fetches user role and permissions
- **Error Handling**: Handles loading and error states

**Components Used**:
- `Header` from `@/components/project/Header`
- `WorkflowContent` from `@/components/project/workflow-content`

**State Management**:
- `project`: Project data object
- `loading`: Loading state
- `error`: Error state
- `userRole`: User's role in project
- `permissions`: User permissions object

**API Calls**:
- `apiService.getProject(projectSlug, token)`: Fetch project by slug/ID
- `apiService.getUserRole(projectSlug, token)`: Get user role and permissions

**How It Works**:
1. Extracts slug from URL params
2. Fetches project data and user role
3. Transforms backend data to frontend format
4. Renders Header and WorkflowContent components
5. Handles project updates via callback

---

## Tabs System

The project detail page uses a tabbed interface to organize different views of the project.

### Tab Container Component (`workflow-content.jsx`)

**Location**: `frontend/src/components/project/workflow-content.jsx`

**Purpose**: Container component that manages the main tabs for project views.

**Tabs**:
1. **Workflow Tab**: Main workflow interface (5 steps)
2. **Overview Tab**: Project overview and statistics
3. **Results Tab**: Generated images and history
4. **Collaborators Tab**: Team management

**Components Used**:
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` from `@/components/ui/tabs` (Radix UI)
- `WorkflowTab` from `@/components/project/tabs/workflow-tab`
- `OverviewTab` from `@/components/project/tabs/overview-tab`
- `ResultsTab` from `@/components/project/tabs/results-tab`
- `CollaboratorsTab` from `@/components/project/tabs/collaborators-tab`

**State Management**:
- `activeTab`: Current active tab ("workflow", "overview", "results", "collaborators")
- Uses `useImageGeneration` context to disable tabs during generation

**Key Features**:
- **Sticky Header**: Tab navigation stays at top when scrolling
- **Disabled State**: Tabs disabled during image generation
- **Active State Styling**: Purple border and background for active tab

**How It Works**:
1. Manages active tab state
2. Renders tab triggers with proper styling
3. Conditionally renders tab content based on active tab
4. Disables tab switching during image generation

---

### 1. Workflow Tab (`tabs/workflow-tab.jsx`)

**Location**: `frontend/src/components/project/tabs/workflow-tab.jsx`

**Purpose**: Main workflow interface with 5 sequential steps for project setup and image generation.

**Workflow Steps**:
1. **Brief & Concept**: Project description, target audience, campaign season
2. **Moodboard Setup**: Themes, backgrounds, poses, locations, colors, global instructions
3. **Model Preview Selection**: AI or real model selection
4. **Product Upload**: Upload product images with generation type selections
5. **Final Image Generation**: Generate and view product images

**Components Used**:
- `WorkflowSteps`: Step navigation component
- `BriefAndConcept`: Step 1 component
- `ThemesAndBackgrounds`: Step 2 component (themes, backgrounds, poses, locations)
- `ColorPalette`: Step 2 component (colors)
- `GlobalInstructions`: Step 2 component (instructions)
- `ModelSelectionSection`: Step 3 component
- `ProductUploadPage`: Step 4 component
- `GenerateSection`: Step 5 component (generation controls)
- `ImageGrid`: Step 5 component (image display)
- `Button` from `@/components/ui/button`
- Icons: `ChevronLeft`, `Lock` from `lucide-react`

**State Management**:
- `activeStep`: Current step number (1-5)
- `collectionData`: Collection data from backend
- `loading`: Loading state
- `error`: Error state
- `successMessage`: Success message state
- `savedSteps`: Set of completed step numbers
- `suggestionsRequested`: Boolean for AI suggestions
- `briefFormData`: Form data from BriefAndConcept
- `currentSelections`: Current moodboard selections
- `uploadedImages`: Uploaded image references
- `selectedModel`: Selected model object
- `productUploadPageRef`: Ref to ProductUploadPage component

**Key Features**:
- **Sequential Unlocking**: Steps unlock only after previous step is saved
- **Permission-Based Access**: Shows view-only message for non-editors
- **Step Navigation**: Clickable step indicators
- **Save and Continue**: Saves current step and moves to next
- **Back Button**: Navigate to previous step
- **Next Button**: Navigate to next unlocked step

**Step Unlocking Logic**:
- Step 1: Always accessible
- Step 2: Unlocks when Step 1 is saved (targetAudience + campaignSeason)
- Step 3: Unlocks when Step 2 is saved (selections made)
- Step 4: Unlocks when Step 3 is saved (model selected)
- Step 5: Unlocks when Step 4 is saved (products uploaded)

**API Calls**:
- `apiService.getCollection(collectionId, token)`: Fetch collection data
- `apiService.updateCollectionDescription(...)`: Save Step 1
- `apiService.updateCollectionSelections(...)`: Save Step 2
- `apiService.selectModel(...)`: Save Step 3
- Product upload handled in ProductUploadPage
- Image generation handled in GenerateSection

**How It Works**:
1. Loads collection data on mount
2. Initializes saved steps based on backend data
3. Renders appropriate step component based on `activeStep`
4. Handles step saving and navigation
5. Manages step unlocking logic

---

### 2. Overview Tab (`tabs/overview-tab.jsx`)

**Location**: `frontend/src/components/project/tabs/overview-tab.jsx`

**Purpose**: Displays comprehensive project overview including statistics, selected elements, and model information.

**Sections**:
1. **Project & Collection Details**: Project name, status, dates, description
2. **Selected Elements**: Themes, backgrounds, poses, locations, colors, global instructions
3. **Model Selection & Products**: Model preview and product count
4. **Generation Status**: Statistics for different image types

**Components Used**:
- `ProductImagesDisplay`: Display product images
- Icons: `CircleDot`, `Clock`, `Calendar`, `FileText`, `Image`, `Package`, `User`, `CheckCircle`, `Palette`, `MapPin`, `Camera`, `Sparkles`

**State Management**:
- `collectionData`: Collection data
- `loading`: Loading state
- `stats`: Statistics object (totalImages, products, variations, completion)
- `modelStats`: Model usage statistics

**Key Features**:
- **Project Information**: Name, status, creation date, last modified
- **Selected Elements Display**: Shows all selected themes, backgrounds, poses, locations, colors
- **Color Display**: Shows selected colors as text and picked colors as color swatches
- **Uploaded Images**: Displays uploaded reference images
- **Model Preview**: Shows selected model image
- **Generation Statistics**: Counts for white background, background replace, model images, campaign images, regenerated images

**API Calls**:
- `apiService.getCollection(collectionId, token)`: Fetch collection data
- `apiService.getModelUsageStats(collectionId, token)`: Fetch model statistics

**Helper Components**:
- `InfoCard`: Displays project information with icon
- `Description`: Displays description text
- `StatCard`: Displays statistics
- `SelectionSection`: Displays selected items and uploaded images
- `GenerationStatCard`: Displays generation type statistics

**How It Works**:
1. Loads collection data on mount
2. Calculates statistics from collection data
3. Fetches model usage statistics
4. Renders all sections with appropriate data
5. Displays selected elements and uploaded images

---

### 3. Results Tab (`tabs/results-tab.jsx`)

**Location**: `frontend/src/components/project/tabs/results-tab.jsx`

**Purpose**: Displays generated images, history, and provides download functionality.

**Sections**:
1. **Statistics Cards**: Total images, products, models used, completion
2. **Action Bar**: Download all button
3. **Product Images Display**: Current generated images
4. **Generation History**: Previously generated images with filtering and pagination

**Components Used**:
- `ProductImagesDisplay`: Display current product images
- `Button` from `@/components/ui/button`
- Icons: `Download`, `Image`, `Calendar`, `Clock`, `ChevronLeft`, `ChevronRight`

**State Management**:
- `collectionData`: Collection data
- `loading`: Loading state
- `stats`: Statistics object
- `modelStats`: Model usage statistics
- `historyData`: Generation history data
- `historyLoading`: History loading state
- `isDownloading`: Download state
- `imageFilter`: Filter type ('all', 'white_background', 'background_replace', 'model_image', 'campaign_image')
- `currentPage`: Current page number for pagination
- `imagesPerPage`: Images per page (12)

**Key Features**:
- **Statistics Display**: Shows total images, products, models, completion
- **Download All**: Downloads all generated images
- **Image Filtering**: Filter by image type (All, White Background, Background Replace, Model Image, Campaign Image)
- **Pagination**: 12 images per page with navigation
- **Image Grid**: 4-column grid layout
- **Hover Overlay**: Shows image type and download button on hover
- **History Display**: Shows previously generated images from history

**Image Types**:
- `project_white_background`: White background images
- `project_background_replace`: Background replacement images
- `project_model_image`: Model images
- `project_ai_model_generation`: AI-generated model images
- `project_campaign_image`: Campaign images

**API Calls**:
- `apiService.getCollection(collectionId, token)`: Fetch collection data
- `apiService.getModelUsageStats(collectionId, token)`: Fetch model statistics
- `apiService.getCollectionHistory(collectionId, token)`: Fetch generation history

**Download Functionality**:
- **Single Image Download**: Downloads individual image
- **Bulk Download**: Downloads all images with delay between downloads
- **History Download**: Downloads all history images
- Uses blob API for cross-origin image downloads

**How It Works**:
1. Loads collection data and history on mount
2. Calculates statistics
3. Filters and paginates images based on filter and page
4. Renders image grid with hover effects
5. Handles download functionality with proper error handling

---

### 4. Collaborators Tab (`tabs/collaborators-tab.jsx`)

**Location**: `frontend/src/components/project/tabs/collaborators-tab.jsx`

**Purpose**: Manages project team members, invitations, and role permissions.

**Sections**:
1. **Statistics Cards**: Total members, created date, pending invites
2. **Team Members**: List of active team members with role management
3. **Pending Invitations**: List of pending invitations
4. **Role Permissions**: Explanation of role permissions

**Components Used**:
- `InviteModal`: Modal for inviting team members
- `Card` from `@/components/ui/card`
- `Badge` from `@/components/ui/badge`
- `Avatar`, `AvatarImage`, `AvatarFallback` from `@/components/ui/avatar`
- `Button` from `@/components/ui/button`
- `DropdownMenu` components from `@/components/ui/dropdown-menu`
- Icons: `Copy`, `UserPlus`, `Users`, `Mail`, `Crown`, `Edit3`, `Eye`, `MoreVertical`, `Star`, `Loader2`, `CheckCircle`, `UserCog`

**State Management**:
- `isInviteModalOpen`: Invite modal open state
- `inviteLoading`: Invite loading state
- `teamMembers`: Array of team members
- `pendingInvites`: Array of pending invitations
- `loading`: Loading state
- `successMessage`: Success message
- `roleChangeLoading`: Loading state for role changes

**Roles**:
- **Owner**: Full project access, manage team, delete project, change settings
- **Editor**: Edit content, upload images, modify workflows, cannot manage team
- **Viewer**: View only, cannot make changes or invite others

**Key Features**:
- **Invite Team Members**: Send email invitations with role selection
- **Copy Invite Link**: Copy shareable invite link
- **Role Management**: Change member roles (owner only)
- **Member Display**: Shows member name, email, role, avatar
- **Pending Invites**: Shows pending invitations with inviter information
- **Role Badges**: Color-coded badges for each role
- **Permission Display**: Shows what each role can do

**API Calls**:
- `apiService.getProject(projectId)`: Fetch project with team members
- `apiService.listInvites(projectId, token)`: Fetch pending invitations
- `apiService.inviteUser(projectId, email, role, token)`: Send invitation
- `apiService.updateMemberRole(projectId, memberId, newRole, token)`: Update member role

**How It Works**:
1. Loads project data and pending invites on mount
2. Displays team members with role badges
3. Allows owners to change member roles via dropdown
4. Opens invite modal for sending invitations
5. Shows pending invitations with status
6. Displays role permissions information

---

## Workflow Components

### Step 1: Brief & Concept (`brief-and-concept.jsx`)

**Location**: `frontend/src/components/project/brief-and-concept.jsx`

**Purpose**: Collects project description, target audience, and campaign season.

**Fields**:
- **Description** (Optional): Project description textarea
- **Target Audience** (Required): Text input
- **Campaign Season** (Required): Text input

**Components Used**:
- `FileText` icon from `lucide-react`

**State Management**:
- `description`: Description text
- `targetAudience`: Target audience text
- `campaignSeason`: Campaign season text
- `hasDescription`: Boolean flag for description presence

**Key Features**:
- **Optional Description**: Description is optional but enables AI suggestions
- **Required Fields**: Target audience and campaign season are required
- **Form Data Exposure**: Exposes form data to parent via `onFormDataChange`
- **Data Loading**: Loads existing data from collectionData
- **Disabled State**: Respects `canEdit` prop for view-only mode

**How It Works**:
1. Loads existing data from collectionData on mount
2. Updates parent component with form data changes
3. Validates required fields (targetAudience, campaignSeason)
4. Description triggers AI suggestions if provided

---

### Step 2: Moodboard Setup

#### Themes & Backgrounds (`themes-and-backgrounds.jsx`)

**Location**: `frontend/src/components/project/themes-and-backgrounds.jsx`

**Purpose**: Allows selection and upload of themes, backgrounds, poses, and locations.

**Sections**:
1. **Themes**: AI suggestions and manual selection/upload
2. **Backgrounds**: AI suggestions and manual selection/upload
3. **Poses**: AI suggestions and manual selection/upload
4. **Locations**: AI suggestions and manual selection/upload

**Components Used**:
- `MultiSelect` from `@/components/ui/multi-select`
- `Button` from `@/components/ui/button`
- Icons: `ChevronDown`, `Upload`, `X`, `Image`, `Eye`

**State Management**:
- `selectedThemes`: Array of selected theme strings
- `selectedBackgrounds`: Array of selected background strings
- `selectedPoses`: Array of selected pose strings
- `selectedLocations`: Array of selected location strings
- `uploadedImages`: Object with arrays for each category
- `uploading`: Object with boolean flags for each category

**Key Features**:
- **AI Suggestions**: Shows AI-generated suggestions if description provided
- **Multi-Select**: Allows selecting multiple items from suggestions
- **Image Upload**: Upload reference images for each category
- **Image Preview**: Preview uploaded images with delete option
- **Selection Persistence**: Saves selections to backend
- **Server-Side Storage**: Uploaded images stored on server

**API Calls**:
- `apiService.uploadWorkflowImage(...)`: Upload reference images
- `apiService.deleteWorkflowImage(...)`: Delete uploaded images

**How It Works**:
1. Loads AI suggestions from collectionData
2. Loads existing selections and uploaded images
3. Allows selecting from suggestions or uploading images
4. Notifies parent of selection and image changes
5. Uploads images immediately to server

---

#### Color Palette (`color-palette.jsx`)

**Location**: `frontend/src/components/project/color-palette.jsx`

**Purpose**: Allows selection and picking of colors for the project.

**Sections**:
1. **AI Color Suggestions**: AI-generated color suggestions
2. **Selected Colors**: Text-based color selections
3. **Color Picker**: Visual color picker for custom colors
4. **Color Instructions**: Text instructions for color usage
5. **Uploaded Color Images**: Reference images for color inspiration

**Components Used**:
- `MultiSelect` from `@/components/ui/multi-select`
- `ColorPicker` from `@/components/ui/color-picker`
- `Button` from `@/components/ui/button`
- Icons: `Upload`, `X`, `Eye`

**State Management**:
- `selectedColors`: Array of selected color strings
- `pickedColors`: Array of picked color hex values
- `colorInstructions`: Text instructions for colors
- `uploadedImages`: Array of uploaded color reference images
- `uploading`: Upload loading state

**Key Features**:
- **AI Suggestions**: Shows AI-generated color suggestions
- **Text Selection**: Select colors from suggestion list
- **Color Picker**: Pick custom colors with hex values
- **Color Instructions**: Add text instructions for color usage
- **Image Upload**: Upload color reference images
- **Color Display**: Shows picked colors as color swatches

**API Calls**:
- `apiService.uploadWorkflowImage(...)`: Upload color reference images
- `apiService.deleteWorkflowImage(...)`: Delete uploaded images

**How It Works**:
1. Loads AI color suggestions from collectionData
2. Loads existing selections, picked colors, and uploaded images
3. Allows selecting, picking, or uploading colors
4. Notifies parent of changes
5. Saves color instructions separately

---

#### Global Instructions (`global-instructions.jsx`)

**Location**: `frontend/src/components/project/global-instructions.jsx`

**Purpose**: Allows adding global instructions for how selections should be used.

**Fields**:
- **Global Instructions**: Textarea for instructions

**Components Used**:
- `FileText` icon from `lucide-react`

**State Management**:
- `instructions`: Instructions text

**Key Features**:
- **Text Instructions**: Free-form text for how to use selections
- **Parent Notification**: Notifies parent of instruction changes
- **Data Loading**: Loads existing instructions from collectionData
- **Disabled State**: Respects `canEdit` prop

**How It Works**:
1. Loads existing instructions from collectionData
2. Updates parent component on change
3. Instructions saved with other Step 2 selections

---

### Step 3: Model Selection (`model-selection-section.jsx`)

**Location**: `frontend/src/components/project/model-selection-section.jsx`

**Purpose**: Allows selection of AI-generated or real uploaded models.

**Tabs**:
1. **AI Models**: Generate and select AI models
2. **Real Models**: Upload and select real models

**Components Used**:
- `Button` from `@/components/ui/button`
- Icons: `Users`, `Sparkles`, `CheckCircle`, `Upload`, `Image`, `X`, `Eye`

**State Management**:
- `activeTab`: Current tab ('ai' or 'real')
- `aiModels`: Array of available AI models
- `generatedModels`: Array of newly generated AI models
- `generating`: AI generation loading state
- `realModels`: Array of uploaded real models
- `uploadingReal`: Real model upload loading state
- `selectedModel`: Currently selected model object
- `loading`: General loading state
- `error`: Error state
- `success`: Success state

**Key Features**:
- **AI Model Generation**: Generate AI models based on collection data
- **Real Model Upload**: Upload real model images
- **Model Selection**: Select model for use in generation
- **Model Preview**: Preview selected model
- **Model Deletion**: Delete uploaded models
- **Model Persistence**: Saves selected model to backend

**API Calls**:
- `apiService.getAllModels(collectionId, token)`: Fetch all models
- `apiService.generateAIModels(collectionId, token)`: Generate AI models
- `apiService.uploadRealModel(collectionId, files, token)`: Upload real model
- `apiService.selectModel(collectionId, type, model, token)`: Select model
- `apiService.removeModel(collectionId, type, model, token)`: Delete model

**How It Works**:
1. Loads existing models on mount
2. Allows generating AI models or uploading real models
3. Displays models in grid with selection capability
4. Saves selected model to backend
5. Notifies parent of model selection

---

### Step 4: Product Upload (`product-upload-page.jsx`)

**Location**: `frontend/src/components/project/product-upload-page.jsx`

**Purpose**: Upload product images and select generation types for each product.

**Features**:
- **Product Image Upload**: Upload multiple product images
- **Ornament Type Selection**: Select ornament type for each product
- **Generation Type Selection**: Select which image types to generate (Plain BG, Background Replace, Model, Campaign)
- **Bulk Selection**: Select all products for a generation type
- **Credit Calculation**: Shows credit cost for generation

**Components Used**:
- `HierarchicalOrnamentSelect`: Ornament type selector
- `Button` from `@/components/ui/button`
- Icons: `Upload`, `X`, `CheckCircle`, `Image`, `Eye`, `CheckSquare`, `Square`

**State Management**:
- `selectedFiles`: Array of selected files
- `fileOrnamentTypes`: Map of file index to ornament type
- `filePreviews`: Map of file index to preview URL
- `uploadedProducts`: Array of uploaded products
- `uploading`: Upload loading state
- `deleting`: Delete loading state
- `selections`: Object mapping product index to generation type selections
- `columnSelections`: Bulk selection state for columns
- `creditSettings`: Credit settings from API

**Generation Types**:
- `plainBg`: Plain/white background images
- `bgReplace`: Background replacement images
- `model`: Model images
- `campaign`: Campaign images

**Key Features**:
- **File Upload**: Drag-and-drop or click to upload
- **Image Preview**: Preview uploaded images
- **Ornament Selection**: Hierarchical ornament type selection
- **Generation Selection**: Checkboxes for each generation type
- **Bulk Operations**: Select/deselect all for a column
- **Credit Display**: Shows credit cost
- **Product Management**: Delete products
- **Selection Persistence**: Saves selections to backend

**API Calls**:
- `apiService.getCreditSettings()`: Fetch credit settings
- `apiService.uploadProductImages(...)`: Upload product images
- `apiService.deleteProductImage(...)`: Delete product image
- `apiService.saveGenerationSelections(...)`: Save generation type selections

**Exposed Methods (via ref)**:
- `getSelections()`: Returns current generation type selections
- `saveSelections()`: Saves selections to backend

**How It Works**:
1. Loads existing products and selections on mount
2. Handles file selection and upload
3. Displays products in table with generation type checkboxes
4. Manages bulk selection for columns
5. Saves selections when "Save and Continue" is clicked
6. Exposes methods for parent component to access selections

---

### Step 5: Image Generation

#### Generate Section (`generate-section.jsx`)

**Location**: `frontend/src/components/project/generate-section.jsx`

**Purpose**: Controls image generation process and displays progress.

**Features**:
- **Generate Button**: Triggers image generation
- **Progress Display**: Shows generation progress
- **Credit Validation**: Checks if user has enough credits
- **Selection Validation**: Ensures at least one generation type is selected
- **Owner-Only**: Only project owners can generate images

**Components Used**:
- `Button` from `@/components/ui/button`
- Icons: `Sparkles`, `AlertCircle`

**State Management**:
- `generating`: Generation in progress state
- `error`: Error state
- `success`: Success state
- `selectedModel`: Selected model URL
- `generationProgress`: Progress object { current, total }
- `selections`: Generation type selections from ProductUploadPage

**Key Features**:
- **Owner Restriction**: Only owners can generate images
- **Selection Polling**: Polls ProductUploadPage for current selections
- **Progress Tracking**: Shows current/total progress
- **Error Handling**: Displays errors clearly
- **Context Integration**: Uses ImageGenerationContext to disable UI during generation

**API Calls**:
- `apiService.getAllModels(collectionId, token)`: Get selected model
- `apiService.generateProductImages(...)`: Generate images

**How It Works**:
1. Loads selected model on mount
2. Polls ProductUploadPage for selections
3. Validates selections and credits
4. Triggers generation API call
5. Updates ImageGenerationContext during generation
6. Shows progress and handles errors

---

#### Image Grid (`Image-grid.jsx`)

**Location**: `frontend/src/components/project/Image-grid.jsx`

**Purpose**: Displays generated product images in a grid layout.

**Components Used**:
- `ProductImagesDisplay`: Main image display component

**State Management**:
- `collectionData`: Collection data
- `refreshing`: Refresh loading state

**Key Features**:
- **Image Display**: Shows all generated images
- **Regeneration**: Allows regenerating images (if canEdit)
- **Data Refresh**: Refreshes data after regeneration
- **Empty State**: Shows message when no images generated

**How It Works**:
1. Receives collectionData as prop
2. Displays ProductImagesDisplay component
3. Handles regeneration success callback
4. Refreshes data after regeneration

---

## UI Components

### Header Component (`Header.jsx`)

**Location**: `frontend/src/components/project/Header.jsx`

**Purpose**: Displays project header with title, status, and action buttons.

**Features**:
- **Project Title**: Shows project name with initial avatar
- **Status Badge**: Displays project status (In Progress/Completed)
- **Status Toggle**: Toggle between progress and completed (owner only)
- **Edit Project**: Edit project name and description
- **Delete Project**: Delete project with confirmation (owner only)

**Components Used**:
- `Button` from `@/components/ui/button`
- `Input`, `Textarea` from `@/components/ui/input`, `@/components/ui/textarea`
- `Dialog` components from `@/components/ui/dialog`
- Icons: `Edit2`, `Trash2`, `CheckCircle`, `Clock`, `Loader2`

**State Management**:
- `updating`: Status update loading state
- `isEditModalOpen`: Edit modal open state
- `isDeleting`: Delete loading state
- `isSaving`: Save loading state
- `editName`: Edit form name field
- `editDescription`: Edit form description field

**API Calls**:
- `apiService.updateProjectStatus(projectId, status, token)`: Update status
- `apiService.updateProject(projectId, data, token)`: Update project
- `apiService.deleteProject(projectId, token)`: Delete project

**How It Works**:
1. Displays project title and status
2. Shows action buttons for owners
3. Handles status toggle
4. Opens edit modal for project editing
5. Handles project deletion with confirmation

---

### Workflow Steps Component (`workflow-steps.jsx`)

**Location**: `frontend/src/components/project/workflow-steps.jsx`

**Purpose**: Visual step navigation indicator for the workflow.

**Features**:
- **5 Steps Display**: Shows all 5 workflow steps
- **Active Step Highlighting**: Highlights current step
- **Completed Step Checkmarks**: Shows checkmark for completed steps
- **Clickable Steps**: Navigate to steps (if unlocked)
- **Disabled State**: Disabled during image generation

**Components Used**:
- `Check` icon from `lucide-react`

**Props**:
- `activeStep`: Current step number
- `setActiveStep`: Function to change step
- `savedSteps`: Set of saved step numbers
- `isStepUnlocked`: Function to check if step is unlocked
- `isGenerating`: Boolean for generation state

**How It Works**:
1. Renders 5 step indicators
2. Shows checkmark for completed steps
3. Highlights active step
4. Allows clicking unlocked steps
5. Disables interaction during generation

---

## Data Flow

### Project Creation Flow
1. User fills form on Create Project page
2. API creates project and collection
3. Redirects to project detail page
4. Project detail page loads project data
5. Workflow tab initializes with empty collection

### Workflow Step Flow
1. User completes Step 1 (Brief & Concept)
2. Saves Step 1 → Unlocks Step 2
3. User completes Step 2 (Moodboard Setup)
4. Saves Step 2 → Unlocks Step 3
5. User completes Step 3 (Model Selection)
6. Saves Step 3 → Unlocks Step 4
7. User completes Step 4 (Product Upload)
8. Saves Step 4 → Unlocks Step 5
9. User generates images in Step 5
10. Images displayed in Image Grid

### Data Persistence
- Each step saves data to backend immediately
- Collection data fetched on component mount
- Saved steps tracked in `savedSteps` Set
- Step unlocking based on saved steps

### State Management
- **Local State**: Component-specific state (forms, selections)
- **Context**: ImageGenerationContext for global generation state
- **API State**: Data fetched from backend and stored locally
- **Parent-Child Communication**: Props and callbacks

---

## Key Features

### 1. Sequential Step Unlocking
- Steps unlock only after previous step is saved
- Prevents skipping steps
- Visual indicators show locked/unlocked state

### 2. Permission-Based Access
- **Owner**: Full access, can generate images
- **Editor**: Can edit but cannot generate images
- **Viewer**: Read-only access
- UI adapts based on user role

### 3. AI Suggestions
- AI generates suggestions based on project description
- Suggestions shown in Step 2 (Moodboard Setup)
- Optional feature (requires description)

### 4. Image Generation Types
- **Plain/White Background**: Product on white background
- **Background Replace**: Product with custom background
- **Model Images**: Product with model
- **Campaign Images**: Full campaign shots

### 5. Collaboration
- Invite team members via email
- Role-based permissions
- Shareable invite links
- Pending invitation management

### 6. Image History
- Tracks all generated images
- Filter by image type
- Pagination for large sets
- Download functionality

### 7. Credit System
- Shows credit cost before generation
- Validates sufficient credits
- Credit settings fetched from API

### 8. Real-time Updates
- Collection data refreshes after operations
- Progress tracking during generation
- Success/error messages

---

## Common Patterns

### Component Structure
```jsx
export function ComponentName({ prop1, prop2, onSave, canEdit }) {
    // State declarations
    const [state, setState] = useState(initial)
    
    // Effects
    useEffect(() => {
        // Load data
    }, [dependencies])
    
    // Handlers
    const handleAction = async () => {
        // API call
        // Update state
        // Notify parent
    }
    
    // Render
    return (
        <div>
            {/* Component JSX */}
        </div>
    )
}
```

### API Call Pattern
```javascript
try {
    setLoading(true)
    setError(null)
    const response = await apiService.method(params, token)
    if (response.success) {
        // Handle success
        setSuccess('Operation successful')
    } else {
        throw new Error(response.error)
    }
} catch (err) {
    setError(err.message)
} finally {
    setLoading(false)
}
```

### Parent-Child Communication
```javascript
// Parent passes callback
<ChildComponent onDataChange={handleDataChange} />

// Child notifies parent
useEffect(() => {
    if (onDataChange) {
        onDataChange(data)
    }
}, [data, onDataChange])
```

---

## Best Practices

1. **Always check `canEdit` prop** before allowing edits
2. **Validate required fields** before API calls
3. **Show loading states** during async operations
4. **Handle errors gracefully** with user-friendly messages
5. **Refresh data** after mutations
6. **Use proper TypeScript types** (if applicable)
7. **Follow naming conventions** for components and functions
8. **Keep components focused** on single responsibility
9. **Extract reusable logic** into custom hooks
10. **Test edge cases** (empty states, errors, loading)

---

## Troubleshooting

### Common Issues

1. **Steps not unlocking**
   - Check if previous step is saved to backend
   - Verify `savedSteps` Set contains previous step number
   - Check `isStepUnlocked` function logic

2. **Images not displaying**
   - Verify image URLs are correct
   - Check CORS settings for image domains
   - Verify collection data structure

3. **Permissions not working**
   - Check user role from API
   - Verify `canEdit` prop is passed correctly
   - Check permission utility functions

4. **Generation not starting**
   - Verify user is owner
   - Check if model is selected
   - Verify product images are uploaded
   - Check if generation types are selected
   - Verify sufficient credits

5. **Data not persisting**
   - Check API response structure
   - Verify token is valid
   - Check network requests in DevTools
   - Verify backend endpoints

---

## Additional Resources

- **API Documentation**: See `frontend/src/lib/api.js` for API methods
- **Context Documentation**: See `frontend/src/context/` for context providers
- **UI Components**: See `frontend/src/components/ui/` for reusable components
- **Permissions**: See `frontend/src/lib/permissions.js` for permission utilities

---

---

## Supporting Components

### Product Images Display (`product-images-display.jsx`)

**Location**: `frontend/src/components/project/product-images-display.jsx`

**Purpose**: Displays generated product images with regeneration capabilities.

**Features**:
- **Image Grid**: Displays all generated images organized by product
- **Image Types**: Shows different image types (white background, background replace, model, campaign)
- **Regeneration**: Regenerate individual images with custom prompts
- **Model Selection**: Option to use different model for regeneration
- **Image Zoom**: Zoom functionality for image preview
- **Version Management**: Tracks and displays image versions
- **Download**: Download individual images

**Components Used**:
- `Button` from `@/components/ui/button`
- Icons: `Download`, `ExternalLink`, `RefreshCw`, `X`, `Sparkles`, `Image`

**State Management**:
- `regenerating`: Currently regenerating image ID
- `showPromptModal`: Image ID for which prompt modal is open
- `customPrompt`: Custom prompt text for regeneration
- `error`: Error state
- `currentVersionMap`: Map of current version for each image
- `zoomedImage`: Currently zoomed image URL
- `useDifferentModel`: Boolean for using different model
- `selectedModel`: Selected model for regeneration
- `availableModels`: Available models for selection

**Key Features**:
- **Product Organization**: Images grouped by product
- **Type Badges**: Visual badges for image types
- **Regeneration Modal**: Modal for custom prompt and model selection
- **Version Display**: Shows regenerated versions
- **Empty State**: Message when no images generated

**API Calls**:
- `apiService.regenerateImage(...)`: Regenerate image with custom prompt
- `apiService.getAllModels(...)`: Fetch available models

**How It Works**:
1. Receives collectionData with product images
2. Organizes images by product and type
3. Displays images in grid layout
4. Handles regeneration with custom prompts
5. Manages image versions and zoom state

---

### Invite Modal (`InviteModal.jsx`)

**Location**: `frontend/src/components/project/InviteModal.jsx`

**Purpose**: Modal dialog for inviting team members to projects.

**Features**:
- **User Search**: Search for users by email or name
- **Role Selection**: Select role (Owner, Editor, Viewer)
- **User List**: Display available users with avatars
- **Invite Button**: Send invitation
- **Error Handling**: Display validation errors

**Components Used**:
- `Button` from `@/components/ui/button`
- `Card` from `@/components/ui/card`
- `Badge` from `@/components/ui/badge`
- `Avatar`, `AvatarImage`, `AvatarFallback` from `@/components/ui/avatar`
- Icons: `X`, `UserPlus`, `Crown`, `Edit3`, `Eye`, `Search`, `Loader2`

**State Management**:
- `selectedUser`: Selected user object
- `selectedRole`: Selected role string
- `error`: Error message
- `searchQuery`: Search filter string
- `availableUsers`: Array of available users
- `loadingUsers`: Loading state for user search

**Roles**:
- **Owner**: Full access, can manage team
- **Editor**: Can edit and contribute
- **Viewer**: Read-only access

**Key Features**:
- **User Search**: Real-time search for users
- **Role Cards**: Visual role selection with descriptions
- **Validation**: Validates email and role selection
- **Loading States**: Shows loading during operations
- **Error Display**: Clear error messages

**API Calls**:
- `apiService.searchUsers(query, token)`: Search for users
- Invitation sent via parent `onInvite` callback

**How It Works**:
1. Opens modal when `isOpen` is true
2. Searches for users based on query
3. Displays available users
4. Allows role selection
5. Sends invitation via parent callback
6. Closes modal on success or cancel

---

### Hierarchical Ornament Select (`hierarchical-ornament-select.jsx`)

**Location**: `frontend/src/components/project/hierarchical-ornament-select.jsx`

**Purpose**: Hierarchical selector for jewelry ornament types.

**Features**:
- **Category Selection**: Select from categories (Necklace, Earrings, Bracelets, etc.)
- **Type Selection**: Select specific type within category
- **Expandable Categories**: Expand/collapse categories
- **Visual Icons**: Icons for each category

**Components Used**:
- Icons: `ChevronDown`, `ChevronRight`, `Sparkles`

**Ornament Categories**:
- **Necklace**: Short, Long, Choker, Pendant, etc.
- **Earrings**: Stud, Jhumka, Drop, Hoop, etc.
- **Bracelets & Bangles**: Bangle, Bracelet, Hand Chain
- **Rings**: Ring, Traditional, Delicate, Cocktail
- **Anklets**: Anklets
- **Head Jewelry**: Maang Tikka, Hair Brooch
- **Nose Jewelry**: Nose Ring, Nose Pin

**State Management**:
- `expandedCategories`: Set of expanded category names
- `selectedCategory`: Selected category name
- `selectedType`: Selected type ID

**Key Features**:
- **Hierarchical Structure**: Categories and sub-types
- **Expandable UI**: Click to expand/collapse categories
- **Type Selection**: Select specific ornament type
- **Visual Feedback**: Highlights selected items

**How It Works**:
1. Displays categories in expandable list
2. Expands category to show types
3. Allows selecting type
4. Returns selected type ID to parent

---

## Conclusion

The Projects Section is a comprehensive feature that provides a structured workflow for product image generation. Understanding the component hierarchy, data flow, and key patterns will help developers effectively work with and extend this feature.

### Summary of Components

**Main Pages**: 3 pages (Listing, Create, Detail)
**Tabs**: 4 tabs (Workflow, Overview, Results, Collaborators)
**Workflow Steps**: 5 steps (Brief, Moodboard, Model, Products, Generation)
**Supporting Components**: 8+ components for various functionalities

### Key Takeaways

1. **Sequential Workflow**: Steps unlock sequentially based on completion
2. **Permission System**: Role-based access control throughout
3. **Data Persistence**: All data saved to backend immediately
4. **State Management**: Mix of local state, context, and API state
5. **Component Communication**: Props, callbacks, and refs for parent-child communication

For questions or issues, refer to the codebase or consult with the development team.
