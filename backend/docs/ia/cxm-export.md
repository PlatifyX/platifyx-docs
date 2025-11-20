# Architecture Documentation

This documentation was generated from multiple sections of the repository.

---

## Repository: Tracksale/cxm-export

### Files Overview

1. **README.md**
- General information about the repository and possibly instructions for setup and usage.

2. **app/sentimentAnalysis/domain/domain.go**
- Contains structs for InteractionSentimentAnalysis, SentimentAnalysisDB, Feedback, and Emotion.
- Implements database sql driver methods for converting structs to and from JSON.
- Provides a TableName method for SentimentAnalysisDB.

3. **cmd/main.go**
- Main application file for cxm-export.
- Initializes logger, loads environment variables, sets up context and signal handling.
- Initializes OpenTelemetry (otelwrapper) for tracing.
- Connects to database and Redis, sets up AWS SQS repository.
- Handles signals for graceful shutdown.

### Components

#### InteractionSentimentAnalysis
- Struct containing UUID and ReferenceUUID.

#### SentimentAnalysisDB
- Struct containing UUID, SurveyUUID, MetadataUUID, ReferenceUUID, ReferenceKind, Feedback, Version, Sentiments, Entities, Categories, Emotion, and CreatedAt.
- Implements TableName method for ORM mapping.
- Feedback and Emotion structs are nested within SentimentAnalysisDB.

#### Feedback
- Struct representing feedback text and segment.

#### Emotion
- Struct representing emotion type and description.

### Interactions

- **SentimentAnalysisDB** interacts with the database using ORM mapping.
- **Feedback** and **Emotion** are nested within **SentimentAnalysisDB**.
- **main.go** initializes components, connects to external services like database, Redis, and AWS SQS.

### Design Patterns

- **ORM (Object-Relational Mapping)**: Used to map struct fields to database columns in **SentimentAnalysisDB**.
- **Factory Pattern**: Utilized for creating logger, database connection, and Redis connection instances in **main.go**.
- **Repository Pattern**: **sqsConnection** acts as a repository for AWS SQS interactions.

Overall, the provided files contain structs for sentiment analysis, configurations, and application startup logic for cxm-export. The code follows a structured organization with clear responsibilities for each component.
---

## AWS Adapter Module

The `aws.go` file in the `adapters` package contains the implementation of the AWSSQSAdapter struct, which is responsible for integrating with AWS services for sending and receiving messages via SQS (Simple Queue Service). This adapter interacts with various other modules within the application to facilitate the export of data.

### Components:
- **cxmSqs**: An interface to connect to AWS SQS service for message queuing and processing.
- **databaseConnection**: An interface to interact with the database for data storage and retrieval.

### Interactions:
- The AWSSQSAdapter communicates with various repositories and entities within the `cxm-export` application, such as customer, distribution, interaction, loop, metadata, organization, survey, team, and user repositories.
- The adapter also interacts with other packages like `cxm-core`, `export`, `blockrule`, `common`, `mailer`, and `upload` for additional functionalities like cache management, email sending, and file uploading.

### Design Patterns Used:
- **Dependency Injection**: The AWSSQSAdapter struct takes in dependencies like logger, environment configuration, and database connection as parameters to decouple the AWS integration logic from external dependencies.
- **Repository Pattern**: The adapter interacts with various repository interfaces (e.g., custRepository, distRepository, orgRepository) to abstract the data access logic and provide a consistent way to access data entities like customers, organizations, and surveys.

```go
type AWSSQSAdapter struct {
	logger               *zap.Logger
	env                  *config.EnvConfig
cxmSqs             sqsConnection.AWSSqsInterface
databaseConnection database.DatabaseConnectionInterfa
// other fields
}
```

## Blockrule Domain Module

The `blockrule` package consists of domain-specific entities and interfaces related to managing block rules for customers based on their email addresses or phone numbers.

### Components:
- **Blockrule**: Represents a block rule entity with attributes like UUID, name, rule, type, customers affected, and timestamps for creation, deletion, and modification.
- **BlockruleType**: An enum for different types of block rules (email or phone).
- **BlockruleRepositoryInterface**: Defines methods to interact with blockrule entities, such as fetching all deleted block rules and matching customer email/phone in block rules.

### Interactions:
- The Blockrule entity is used to define the structure of a block rule and provides methods like GetType() to retrieve the block rule type.
- The BlockruleRepositoryInterface is implemented by repositories to manage block rules, like finding deleted block rules and matching customer email/phone in existing block rules.

### Design Patterns Used:
- **Entity-Repository Pattern**: Separates the entity representation (Blockrule) from the data access logic (BlockruleRepositoryInterface) to maintain a clean architecture and facilitate CRUD operations on block rules.

```go
type Blockrule struct {
	UUID              string `gorm:"primary_key"`
Name              string
Rule              string
Type              *int
CustomersAffected int `gorm:"-"`
IsActive          *bool
CreatedAt         int64
DeletedAt         *int64
ModifiedAt        int64
}
```
---

# Repository: Tracksale/cxm-export

## Components

### `BlockruleRepositoryInterface` (File: app/blockrule/mocks/BlockruleRepositoryInterface.go)
- This file contains a mock interface for the `BlockruleRepositoryInterface` type, generated by mockery v2.42.3.
- It includes methods for finding all deleted block rules and matching email or phone in all block rules.

### `BlockruleRepository` (File: app/blockrule/repository.go)
- This file contains the actual implementation of the `BlockruleRepository` struct, which handles operations related to block rules.
- It includes methods for finding all deleted block rules, matching email in all block rules, matching phone in all block rules, and helper functions for email and phone matching.

### `Category` (File: app/category/domain/category.go)
- This file defines the `Category` struct, which represents a category with various properties like UUID, name, description, color, timestamps, and delete status.

## Interactions

- `BlockruleRepositoryInterface` serves as a mock interface for testing interactions with the actual `BlockruleRepository`.
- `BlockruleRepository` contains methods for finding, matching, and processing block rules based on filters and criteria.
- The `Category` struct defines the structure of a category entity, which could potentially be related to block rules in the application's domain logic.

## Design Patterns Used

- **Mocking Pattern**: Mocking is utilized in `BlockruleRepositoryInterface` for testing interactions with the `BlockruleRepository`.
- **Repository Pattern**: The `BlockruleRepository` implements repository pattern to separate data access logic from business logic, making it easier to manage and test.
- **Strategy Pattern**: The `BlockruleRepository` uses different matching strategies for email and phone based on block rule types.

```go
// Sample code block in Go
// This is for illustrative purposes only
// Please refer to the actual code files for full implementation
```

Overall, this section of the repository includes components for handling block rules and category entities, implementing design patterns like mocking, repository, and strategy for efficient and maintainable code.
---

## app/customer/domain/customer.go

This file defines various constants and types related to customer information and status.

### Components:
- CustomerStatus: Defines the status of a customer.
- DeliveryStatus: Defines the delivery status of a customer.
- DispatchStatus: Defines the dispatch status of a customer.
- AnswerStatus: Defines the answer status of a customer.
- CommentStatus: Defines the comment status of a customer.
- CustomerMetaData: Represents metadata associated with a customer.
- CustomerMetaDataValue: Defines the structure of a customer metadata value.
- Customer: Represents the main customer entity with various attributes like UUID, name, email, etc.

### Interactions:
- The various status types (CustomerStatus, DeliveryStatus, DispatchStatus, AnswerStatus, CommentStatus) define different statuses that a customer can have in the system.
- CustomerMetaDataValue is used to store metadata associated with a customer.
- Customer entity contains all the main attributes related to a customer.

### Design Patterns:
- The use of constants for customer statuses, delivery statuses, dispatch statuses, answer statuses, and comment statuses helps in maintaining a consistent and well-defined set of status values.
- Separation of Customer and CustomerMetaDataValue into separate types helps in keeping the code organized and structured.

```go
// Code snippet omitted for brevity
```

## app/customer/domain/customerMetadata.go

This file defines the CustomerMetadata structure, which represents metadata associated with a customer.

### Components:
- CustomerMetadata: Represents metadata associated with a customer, including UUID, value, and creation timestamp.

### Interactions:
- CustomerMetadata stores metadata information related to a customer, such as the metadata UUID, customer UUID, value, and creation timestamp.

### Design Patterns:
- The CustomerMetadata structure follows a simple pattern of storing metadata information associated with a customer.

```go
// Code snippet omitted for brevity
```

## app/customer/http/httpReqRes.go

This file defines the CustomerMetadataResponse structure for HTTP responses related to customer metadata.

### Components:
- CustomerMetadataResponse: Represents the structure of a response related to customer metadata, including customer UUID, metadata UUID, value, and name.

### Interactions:
- CustomerMetadataResponse is used to structure HTTP responses related to customer metadata and provide a standardized format for communicating customer metadata information.

### Design Patterns:
- The CustomerMetadataResponse structure follows a pattern of defining response structures for specific data entities, in this case, customer metadata.

```go
// Code snippet omitted for brevity
```
---

## Customer Repository Handles Customer Data

The `customer/repository` package in the `cxm-export` application contains the interface, mocks, and implementation for interacting with customer data.

### Components:

1. **Interfaces** (*interfaces.go*):
    - Defines the `CustomerRepositoryInterface` interface, which includes methods for retrieving customer attributes, metadata, interacting with interactions, counting customers, bulk upserting metadata, updating customer identifiers, and more.

2. **Mocks** (*mocks/CustomerRepositoryInterface.go*):
    - Contains autogenerated mock implementations for testing the `CustomerRepositoryInterface`.

3. **Repository Implementation** (*repository.go*):
    - Implements the methods defined in the `CustomerRepositoryInterface`.
    - Uses the `go.uber.org/zap` logger for logging.
    - Utilizes the `gorm` package for database operations.
    - Interacts with the `cxm-core` package for bulk operations, querying filters, and cache storage.

### Interactions:

- The `CustomerRepositoryInterface` interacts with the `cxm-core` package for handling query filters and bulk operations.
- `repository.go` interacts with the database using `gorm` to fetch customer data and metadata.
- The repository implementation handles customer attribute retrieval, counting customers based on various criteria, updating identifiers, and more.

### Design Patterns:

- The repository design follows the Repository Pattern, separating the data access logic from the business logic.
- Mocking is used for testing purposes, providing controlled implementations during unit testing.
- The implementation utilizes the Strategy Pattern for query filtering, allowing for dynamic filter creation based on input parameters.

```go
// Example implementation of FindCustomerAttributesByAttributesUUID method
func (repo *customerRepository) FindCustomerAttributesByAttributesUUID(attributesUUID []string, customersUUID []string) ([]interactionDomain.InteractionAttribute, error) {
    // Database query to fetch customer attributes
}
```
---

## app/customer/useCase.go

### Components
- `CustomerService` struct
- `CustomerServiceOpts` struct
- `ToCsvOptions` struct
- `ToCSV` method

### Interactions
- `ToCSV` method processes CSV export for customers
- Retrieves organization language and identifier
- Retrieves metadata
- Handles CSV export process

### Design Patterns
- Singleton pattern for `CustomerService` struct
- Builder pattern for `ToCsvOptions` struct
- Strategy pattern for processing CSV export

```go
// Code snippet from app/customer/useCase.go
package customer

import (
	"context"
	"encoding/csv"
	"math"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"

import (
	"github.com/Tracksale/cxm-core/pkg/qfilter"
	"github.com/Tracksale/cxm-export/app/blockrule"
	"github.com/Tracksale/cxm-export/app/customer/domain"
	"github.com/Tracksale/cxm-export/app/customer/repository"
	distributionRepository "github.com/Tracksale/cxm-export/app/distribution/repository"
	exportDomain "github.com/Tracksale/cxm-export/app/export/domain"
	exportRepository "github.com/Tracksale/cxm-export/app/export/repository"
	metadataDomain "github.com/Tracksale/cxm-export/app/metadata/domain"
	metadataRepository "github.com/Tracksale/cxm-export/app/metadata/repository"
	organizationRepository "github.com/Tracksale/cxm-export/app/organization/repository"
	"github.com/Tracksale/cxm-export/common"
	"github.com/Tracksale/cxm-export/config"
	"go.uber.org/zap"
)

// Structs and methods defined here...
```

## app/distribution/domain/distribution.go

### Components
- `DistributionSenderType` type
- `DistributionChannel` type
- `DistributionMapping` type
- `DistributionMap` struct
- `DistributionsListed` struct

### Interactions
- Defines sender types, channels, and mappings
- Includes methods for checking dispatch channel
- Defines structures for distribution listings

### Design Patterns
- Enum pattern for `DistributionSenderType` and `DistributionChannel`
- Decorator pattern for mapping metadata to distribution channels

```go
// Code snippet from app/distribution/domain/distribution.go
package domain

import (
	"database/sql/driver"
	"encoding/json"
"errors"

metadataDomain "github.com/Tracksale/cxm-export/app/metadata/domain"
)

// Structs, constants, and methods defined here...
```

## app/distribution/domain/distributionWhatsappTemplate.go

### Components
- `DistributionWhatsappTemplate` struct

### Interactions
- Represents a template for WhatsApp distributions
- Includes UUID, name, variables, language, and other details

### Design Patterns
- None explicitly used in this file

```go
// Code snippet from app/distribution/domain/distributionWhatsappTemplate.go
package domain

// Struct definition for DistributionWhatsappTemplate
type DistributionWhatsappTemplate struct {
	UUID             string `gorm:"primary_key"`
DistributionUUID string `json:"distribution_uuid"`
Name             string `json:"name"`
Variables        string `json:"variables"`
Language         string `json:"language"`
CreatedAt        int64  `gorm:"not null"`
Reminder         bool   `json:"reminder"`
IDProvider       string `json:"id_provider"`
}
```
---

## Distribution Service Component

The Distribution Service component consists of a mock interface defined in the file `DistributionServiceInterface.go`. This interface provides two mock functions: `CustomersDistributionToCSV` and `GetCustomersDistributionStatusAndAttributesV2`. These functions allow for interaction with distribution services in the application. The component is generated using the `mockery v2.49.0` tool and includes dependencies on domain and distribution packages.

### Interaction
- The `CustomersDistributionToCSV` function takes parameters related to customer distribution and returns an error.
- The `GetCustomersDistributionStatusAndAttributesV2` function retrieves customer distribution status and attributes based on the provided options and returns custom domain objects, an integer value, and an error.

## Distribution Repository Component

The Distribution Repository component defines an interface in the file `interfaces.go`. This interface, `DistributionRepositoryInterface`, provides methods for interacting with distribution repositories in the application. The methods include `ListDistributions`, `CountDistributions`, `GetCustomersDistributionStatus`, `FindByUUID`, and `GetCustomersDistribution`. These methods handle operations such as listing distributions, counting distributions, retrieving customer distribution statuses, finding distributions by UUID, and getting customer distributions based on options provided.

### Interaction
- The methods in the `DistributionRepositoryInterface` interface interact with distribution repositories to perform various operations related to distribution data storage and retrieval.

## Design Patterns Used
- Mocking: Both the Distribution Service and Distribution Repository components make use of mocking for testing purposes. Mock functions are defined to simulate the behavior of actual service and repository functions during testing.

---

## Repository: Tracksale/cxm-export

### Files in focus:
1. **File:** app/distribution/repository/repository.go
2. **File:** app/distribution/useCase.go
3. **File:** app/distribution/util/distributionConsts.go

---

### app/distribution/repository/repository.go

#### Components:
- **distributionRepository struct**: Holds references to nodeDBReadOnly, nodeDBWrite, cache, and env configurations.
- **DistributionOptions struct**: Struct for defining various options related to distribution.
- **GetCustomersDistributionStatusV2Options struct**: Struct for defining options to retrieve customer distribution status.

#### Interactions:
- This file interacts with various packages like "gorm", "cxm-export/app/customer/domain", "cxm-core/pkg/store/cache", "aws-sdk-go", etc.
- Methods in this file handle operations related to distribution, customer distribution status, and AWS S3 interactions.

#### Design Patterns:
- This file follows a modular approach with separate structs for different functionalities.
- It utilizes synchronization with the "sync" package for concurrent operations.

```go
// Code snippet for reference:
...
type distributionRepository struct {
    nodeDBReadOnly *gorm.DB
    nodeDBWrite    *gorm.DB
    cache          cache.CacheInterface
    env            *config.EnvConfig
}

type DistributionOptions struct {
    SurveyUUID             string
    DistributionsUUIDs     []string
    // Other fields...
}

type GetCustomersDistributionStatusV2Options struct {
    DistributionUUID string
    CustomerName     *string
    // Other fields...
}

func (r *distributionRepository) GetCustomersDistributionStatus(opts GetCustomersDistributionStatusV2Options) ([]custDomain.CustomersDistributionStatus, error) {
    // Method implementation
}
...
```

---

### app/distribution/useCase.go

#### Components:
- **DistributionServiceInterface interface**: Defines methods for handling distribution-related services.
- **DistributionService struct**: Implements DistributionServiceInterface with references to repositories and other dependencies.

#### Interactions:
- Interacts with repositories for customer, distribution, metadata, organization, segment, survey, team, user, etc.
- Utilizes external packages like "go.uber.org/zap" for logging and "common/upload" for file uploads.

#### Design Patterns:
- Follows Dependency Injection pattern for injecting dependencies into the service.
- Uses interfaces to define contracts for service methods.

```go
// Code snippet for reference:
...
type DistributionService struct {
    env             *config.EnvConfig
    nodeRepo        repository.DistributionRepositoryInterface
    surveyRepo      surveyRepository.SurveyRepositoryInterface
    segmentRepo     segment.SegmentRepositoryInterface
    // Other dependencies...
}
...
```

---

### app/distribution/util/distributionConsts.go

#### Components:
- Utility functions for retrieving default values related to distribution like from name, email, and default date.

#### Interactions:
- This file interacts with the configuration settings to fetch default values related to distribution.

#### Design Patterns:
- Implements a simple utility pattern for fetching default values.

```go
// Code snippet for reference:
...
func GetDefaultFromNameDistribution(env *config.EnvConfig) string {
    return env.DistributionApiFromName
}
...
```

--- 

By documenting these files, we have a clear understanding of the components, interactions, and design patterns used within the distribution module of the Tracksale/cxm-export repository.
---

## app/export/domain/export.go

### Components
- `ExportResource` and `ExportStatus` are enumerated types representing different types of export resources and statuses.
- `ExportFieldColumn` defines a column with a name and field properties.
- `ExportFields` contains columns and metadata for exporting data.
- `ExportSort` defines sorting properties for exporting data.
- `ExportCondition` represents a condition with a name and value.
- `ExportConditions` is a collection of export conditions.
- `Export` is the main struct defining an export task with various properties like UUID, name, CSV URL, user UUID, resource, status, fields, filter, segment UUID, created timestamp, deleted timestamp, sorting, export conditions, and XLSX format flag.
- Constants like `ExportResourceUnknown` and `ExportStatusCreated` define values for resource types and statuses respectively.

### Interactions
- The `Export` struct contains various properties needed to define an export task.
- It uses enumerated types like `ExportResource` and `ExportStatus` to categorize resources and statuses.
- It includes slices of `ExportFieldColumn`, `string`, and `ExportCondition` for defining fields, metadata, and conditions respectively.

### Design Patterns
- The code uses struct composition to define complex export task properties.
- Constants are used to define and represent specific resource types and statuses.

```go
// Sample code block from export.go file
type Export struct {
	UUID        string `gorm:"primary_key" json:"uuid"`
	Name        string
	CsvUrl      *string
	UserUUID    string
	Resource    ExportResource
	Status      ExportStatus
	Fields      ExportFields
	Filter      *string
	SegmentUUID *string
	CreatedAt   int64
	DeletedAt   *int64
	Sort        ExportSort
	Conditions  ExportConditions
	XlsxFormat  bool `json:"xlsx_format"`
}
```

## app/export/errors.go

### Components
- The file contains error messages as variables for various scenarios like building a segment, CSV export error, survey permission retrieval failure, etc.

### Interactions
- These error messages can be used across the export package to handle different error cases.

### Design Patterns
- The use of variables to store error messages follows the best practice of avoiding hardcoded error strings in the code.

```go
// Sample error messages defined in errors.go file
var (
	errBuildSegmentMsg     = "Can build segment"
	errCsvExportMsg        = "CSV Export error"
	errSurveyPermissionMsg = "Can't get survey permissions by user"
	errNotImplementedMsg   = "Not implemented"
	errCsvUploadMsg        = "CSV Upload error"
	errUnknownMsg          = "Unknown error"
)
```

## app/export/exporterUseCase.go

### Components
- The file defines an `ExporterSe` variable which seems to be truncated in the provided code snippet.
- It imports numerous packages related to exporting, interactions, repositories, organizations, segments, users, permissions, etc.

### Interactions
- The file likely contains functions and methods related to the export use cases, interacting with various repositories and services for exporting data.

### Design Patterns
- The use of imports from different packages suggests a modular design approach for handling different aspects of exporting data.

```go
// Sample import statements from exporterUseCase.go file
import (
	"bytes"
	"context"
	"encoding/csv"
	"errors
	"fmt"
	"strconv"
	"strings"
	"time
	// Other package imports...
)
```
---

## Repository: Tracksale/cxm-export

### Components in this Section:

1. **File: app/export/mocks/AWSSqsInterface.go**
- This file contains an autogenerated mock type for the AWSSqsInterface type, generated by the mockery v2.53.4 tool.
- It includes mock functions for handling SQS (Simple Queue Service) operations such as changing message visibility and deleting SQS messages.

2. **File: app/export/mocks/exportFunc.go**
- This file contains an autogenerated mock type for the exportFunc type, generated by the mockery v2.42.3 tool.
- It includes a mock function for executing export operations with the given export object and organization UUID.

3. **File: app/export/repository/interfaces.go**
- This file defines the ExportRepositoryInterface interface, which includes a method for finding the status of an export operation based on a UUID and user UUID.

### Interactions:

- The mock types in the `AWSSqsInterface.go` and `exportFunc.go` files are used for testing purposes to simulate the behavior of the actual AWS SQS interface and export function.
- The `ExportRepositoryInterface` in `interfaces.go` defines a contract for interacting with the data repository to retrieve export status.

### Design Patterns Used:

- This section of the repository follows the principle of separation of concerns by providing mock implementations for external dependencies (AWS SQS interface and export function) for testing purposes.
- It also utilizes the repository pattern by defining an interface (`ExportRepositoryInterface`) for working with export-related data, allowing for flexibility in implementing different data storage mechanisms.

```go
// Example code snippet from AWSSqsInterface.go
func (_m *AWSSqsInterface) ChangeMessageVisibility(queueURL string, messageReceiptHandle *string, messageId *string, visibilityTimeout int64) error {
    // Implementation logic here
}

// Example code snippet from exportFunc.go
func (_m *exportFunc) Execute(_a1 domain.Export, orgUUID string) (string, error) {
    // Implementation logic here
}

// Example code snippet from interfaces.go
type ExportRepositoryInterface interface {
    FindStatusByUUID(uuid string, userUUID string) (domain.ExportStatus, error)
}
```
---

## Export Repository Components

### ExportRepositoryInterface Mocks
The `ExportRepositoryInterface.go` file contains autogenerated mock types for the `ExportRepositoryInterface` type. It provides mock functions for finding status by UUID. This file is generated by the `mockery v2.49.0` tool and should not be edited manually.

```go
// Code generated by mockery v2.49.0. DO NOT EDIT.
```

### ExportRepository
The `repository.go` file defines the `ExportRepository` struct, which contains references to two `gorm.DB` instances for writing and reading, and a `zap.Logger` instance. It implements methods for finding exports by UUID, canceling exports, updating export status, and completing exports.

```go
type ExportRepository struct {
    nodeDBWrite    *gorm.DB
    nodeDBReadOnly *gorm.DB
    logger         *zap.Logger
}
```

## Interactions and Domains

### Interaction Domain
The `interaction.go` file defines constants related to interaction statuses and error codes. It also imports various domain packages such as `customer`, `distribution`, `metadata`, and `survey`. These constants define different states and error codes that an interaction can have.

```go
const (
    InteractionStatusCreated        = InteractionStatus(0)
    InteractionStatusSent           = InteractionStatus(1)
    InteractionStatusOpened         = InteractionStatus(2)
    // Other interaction status constants
    ...
)
```

## Interaction Patterns
The architecture uses the Repository pattern to separate data access concerns from the domain logic. The `ExportRepository` struct encapsulates the data access methods for interacting with the export entities. This helps in decoupling the database operations from the business logic, making the code more maintainable and testable.

The Mocking pattern is used in the `ExportRepositoryInterface` mocks to provide simulated behavior for testing purposes. By generating mock types for interfaces, developers can control the behavior of dependencies during unit tests, enhancing the overall test coverage and accuracy.
---

## Domain Components

### InteractionAnswer

The `InteractionAnswer` struct represents an answer given by a user during an interaction. It includes fields such as the interaction UUID, survey item UUID, question item UUID, answer text, comment, other option, and creation timestamp.

### InteractionAnswerInfo

The `InteractionAnswerInfo` struct provides additional information about an interaction answer, including the type of survey item, the actual question being answered, the maximum scale for the question, the scale type, position, index, answer text, comment, other option, and creation timestamp.

### InteractionMetadata

The `InteractionMetadata` struct stores metadata related to an interaction, such as the interaction UUID, metadata UUID, value, and creation timestamp.

### InteractionMetadataWithName

The `InteractionMetadataWithName` struct is similar to `InteractionMetadata`, but includes an additional field for the name associated with the metadata.

## Interactions and Metadata

The `InteractionAnswer` and `InteractionMetadata` structs are used to capture user responses and additional data related to interactions. The `InteractionAnswerInfo` struct provides a more detailed view of the user responses by including information about the type of survey item, question text, scale details, and position.

## Design Patterns Used

- **Builder Pattern**: The `BuildInfo` method in the `InteractionAnswer` struct follows the Builder pattern by creating and returning an `InteractionAnswerInfo` struct with the relevant information extracted from a `SurveyItem`.

```go
func (answer *InteractionAnswer) BuildInfo(surveyItem surveyDomain.SurveyItem) InteractionAnswerInfo {
	return InteractionAnswerInfo{
		// Populate fields from the surveyItem and answer
	}
}
```

Overall, these domain components facilitate the storage and retrieval of interaction and metadata information in the `cxm-export` application.
---

## App Interaction Component Documentation

### Files Provided
1. **httpReqRes.go**
2. **interactionXlsxExportUsecase.go**
3. **interfaces.go**

### Components Description
#### 1. File: httpReqRes.go
- This file contains the `GetResponse` struct that defines the response structure for HTTP requests in the app.
- It includes various fields such as UUID, survey details, customer details, distribution information, interaction status, channels, timestamps, response time, payment status, anonymization status, sentiment analysis flag, health score, interaction answers, metadata, categories, phone and email blocking information.
- The file imports domain modules related to surveys, categories, distributions, and interactions.

#### 2. File: interactionXlsxExportUsecase.go
- This file is responsible for handling the use cases related to exporting interactions to Xlsx format.
- It defines the `ProcessRequestsParamsXlsx` struct that holds parameters for processing interactions in Xlsx format.
- The file imports various domain modules related to interactions, customers, export, metadata, organization, surveys, and more.
- It also includes a mapping for comment translations and various utility functions.

#### 3. File: interfaces.go
- This file defines the `InteractionRepositoryInterface` interface that specifies methods for interacting with the interaction repository.
- The interface includes methods for retrieving survey data, interaction metadata, interaction attributes, survey UUIDs, answers, categories with sentiment, subcategories with sentiment, and more.
- It also provides methods for bulk operations like upserting metadata and finding interaction metadata maps.

### Interactions
- The `GetResponse` struct in `httpReqRes.go` is used to structure the response for HTTP requests related to interactions.
- The `interactionXlsxExportUsecase.go` file handles exporting interactions to Xlsx format based on input parameters and filters.
- The `InteractionRepositoryInterface` in `interfaces.go` defines the contract for interacting with the interaction repository to fetch various data related to interactions, surveys, metadata, attributes, and categories.

### Design Patterns Used
- The codebase makes use of modularization by separating concerns into different files for HTTP interactions, Xlsx exporting use cases, and repository interfaces.
- Dependency injection is evident through the use of interfaces in `interfaces.go` to abstract repository interactions, allowing for easier testing and flexibility in swapping implementations.

```go
// Sample code snippet from httpReqRes.go
type GetResponse struct {
    UUID     string              `json:"uuid"`
    Survey   GetSurveyResponse   `json:"survey"`
    // Add more fields as needed
}

// Sample code snippet from interactionXlsxExportUsecase.go
type ProcessRequestsParamsXlsx struct {
    Index             int
    QueryCalls        int
    TotalInteractions int64
    ExportUUID        string
    Request           domain.GetInteractionsRecordsRequestXlsx
    Filters           *qfilter.QFiltersParameters
    Attributes        []string
}

// Sample code snippet from interfaces.go
type InteractionRepositoryInterface interface {
    GetSurveyItemUUIDsPermittedSurveys(surveysUUIDs []string, userUUID string) ([]surveyDomain.SurveyItemPermittedSurveys, error)
    // Add more methods as required
}
```
---


## Interaction Repository Components

### InteractionRepositoryInterface
- This is an autogenerated mock type for the InteractionRepositoryInterface
- It contains mock functions for counting all new interactions and finding all interactions based on filters and data permissions

#### Methods:
1. CountAllNew(userUUID *string, filters *qfilter.QFiltersParameters) (int64, error)
   - Mock function to count all new interactions based on user UUID and filters
2. FindAll(filters *qfilter.QFiltersParameters, dataPermissions domain.DataPermissions) ([]domain.InteractionList, error)
   - Mock function to find all interactions based on filters and data permissions

### InteractionRepository
- This is the main repository for interactions
- It includes functions for finding all interactions based on filters and data permissions

#### Fields:
- nodeDBReadOnly: Read-only connection to the database
- nodeDBWriteOnly: Write-only connection to the database
- logger: Logger for logging errors and information
- cache: Cache interface for caching data

#### Methods:
1. FindAll(filters *qfilter.QFiltersParameters, dataPermissions domain.DataPermissions) ([]domain.InteractionList, error)
   - Finds all interactions based on filters and data permissions

2. makeQueryFindAll(filters *qfilter.QFiltersParameters, dataPermissions domain.DataPermissions) (*gorm.DB, string)
   - Constructs a query to find all interactions with additional joins
   - Returns the query and select string

3. makeQueryFindAllDefault(filters *qfilter.QFiltersParameters, dataPermissions domain.DataPermissions) (*gorm.DB, string)
   - Constructs a default query to find all interactions with default joins
   - Returns the query and select string

### Design Patterns Used:
- The repository follows the repository pattern for data access
- Dependency injection is used to provide database connections and other dependencies to the repository functions

```go
// Sample code block for InteractionRepositoryInterface
type InteractionRepositoryInterface struct {
	mock.Mock
}

// Sample code block for InteractionRepository
type InteractionRepository struct {
	nodeDBReadOnly  *gorm.DB
	nodeDBWriteOnly *gorm.DB
	logger          *zap.Logger
	cache           cache.CacheInterface
}
```
---

## **Repository: Tracksale/cxm-export**

### **File: app/interaction/useCase.go**

The `useCase.go` file contains the implementation of various use cases related to interactions for the cxm-export application. It includes functionality for processing requests, interacting with different domains, repositories, and external services. 

Components:
- `ProcessRequestsParams`: A struct defining parameters required for processing requests.
- Various imports for interacting with customer, export, interaction, organization, survey, user, and other domains.
- Functions for handling interactions, filtering, logging, and error handling.

Interactions:
- The file interacts with various modules like customer, export, interaction, metadata, organization, sentimentAnalysis, survey, user, and common utilities.
- It integrates data from different sources to process requests, interact with external APIs, and perform export operations.
- Uses concurrency via goroutines and channels for efficient processing.

Design Patterns:
- This file follows a modular design pattern by separating concerns into different packages and structuring the codebase.
- Utilizes interfaces and dependency injection to promote decoupling and testability.
- Implements error handling strategies and logging using the Zap package.

```go
// Sample code snippet from useCase.go
type ProcessRequestsParams struct {
	Index             int
	QueryCalls        int
	WithQuotes        bool
	TotalInteractions int64
	ExportUUID        string
	Request           d
...
```

### **File: app/interaction/util/interactionConsts.go**

The `interactionConsts.go` file contains utility functions and constants related to interactions within the cxm-export application. It includes functions for mapping interaction answers, handling different languages, and manipulating data structures.

Components:
- `sliceAnswer`: A struct defining answer options in different languages.
- Function `InteractionAnswersMapper`: Maps interaction answers based on specified language preferences.

Interactions:
- This file interacts with the interaction and survey domains to process and manipulate interaction data.
- It handles different types of interaction answers, including comments, multiple-choice options, and language preferences.

Design Patterns:
- Utilizes map data structures for mapping language preferences to answer options.
- Implements conditional logic and data manipulation based on interaction attributes.
- Uses JSON parsing for processing interaction answers stored in different formats.

```go
// Sample code snippet from interactionConsts.go
type sliceAnswer struct {
	EnUs string `json:"en_US"`
	EsEs string `json:"es_ES"`
	PtBr string `json:"pt_BR"`
}

func InteractionAnswersMapper(interactionAnswersMapped []domain.InteractionAnswerData, interactionPrincipalAnswersMapped *[]domain.InteractionAnswerData, compositeInteractions *[]domain.InteractionAnswerData) []domain.InteractionAnswerData {
...
```

### **File: app/loop/domain/common.go**

The `common.go` file within the loop domain defines common structures and functions related to loop priorities in the cxm-export application. It includes constants for different priority levels and a function to convert priority integers to strings.

Components:
- `Priority`: An enum type defining different priority levels (Low, Medium, High).
- Function `PriorityToString`: Converts integer priority values to human-readable strings.

Interactions:
- This file primarily interacts with components related to loop functionality and priority handling.
- Provides a conversion mechanism from integer priorities to descriptive strings for display purposes.

Design Patterns:
- Implements an enum-like structure for representing priority levels.
- Uses a switch statement for efficient mapping of priority values to corresponding strings.

```go
// Sample code snippet from common.go
type Priority int

const (
	PriorityLow    = Priority(1)
PriorityMedium = Priority(2)
PriorityHigh   = Priority(3)
)

func PriorityToString(priority int) string {
...
```

This section of the repository contains key components related to interactions, utility functions, and loop priorities in the cxm-export application, showcasing modular design and interaction patterns within the codebase.
---

## app/loop/domain/dealt.go

This file defines the `DealtStatus` type and its associated constants. It also includes a method `ToString()` which returns a string representation of the `DealtStatus`.

```go
package domain

type DealtStatus int

const (
	DealtStatusOpen     = DealtStatus(1)
	DealtStatusOngoing  = DealtStatus(2)
	DealtStatusFinished = DealtStatus(3)
)

func (d DealtStatus) ToString() string {
	switch d {
	case DealtStatusOpen:
		return "Aberto"
	case DealtStatusOngoing:
		return "Em Andamento"
	case DealtStatusFinished:
		return "Concluído"
	default:
		return ""
	}
}
```

## app/loop/domain/loop.go

This file defines the `LoopExport` struct, which represents data related to a specific loop export. It includes fields for UUID, name, priority, health score, customer information, timestamps, user UUID, and various other details.

```go
package domain

type LoopExport struct {
	UUID                          string      `gorm:"primary_key;type:uuid" json:"uuid"`
	Name                          string      `json:"name"`
	Priority                      Priority    `json:"priority"`
	HealthScore                   *int        `json:"health_score"`
	// Other fields omitted for brevity
}
```

## app/loop/domain/timelineEvent.go

This file includes the definitions of various types related to timeline events, such as `TicketEvent`, `ClosingOperator`, and `TicketTimelineData`. Additionally, it defines the `EventType` constants and a method `ToString()` to convert the event type to a string representation.

```go
package domain

type (
	TicketEvent struct {
		UUID          string    `json:"uuid"`
		DealtUUID     string    `json:"dealt_uuid"`
	EventType     EventType `json:"event_type"`
	EventDate     int64     `json:"event_date"`
	UserUUID      string    `json:"user_uuid"`
	// Other fields omitted for brevity
	}
)

type EventType int

const (
	EventTypeBegin          = EventType(1)
	EventTypeAssign         = EventType(2)
	// Other event type constants omitted for brevity
)

func (e EventType) ToString() string {
	switch e {
	case EventTypeBegin:
		return "Iniciado"
	case EventTypeAssign:
		return "Atribuído"
	// Other event type cases omitted for brevity
	default:
		return "Desconhecido"
	}
}
```

## Interactions and Design Patterns

- The `DealtStatus` type in `dealt.go` is utilized by the `LoopExport` struct in `loop.go` to represent the status of the loop export.
- The `TicketEvent` and `ClosingOperator` structs in `timelineEvent.go` are used within the `TicketTimelineData` struct to capture events and operators involved in a ticket timeline.
- The `ToString()` methods in both `dealt.go` and `timelineEvent.go` files utilize the strategy design pattern to convert the enum values to readable string representations.
---

## app/loop Package Documentation

The `app/loop` package contains the logic related to managing loops in the Tracksale system. It includes error handling, use case implementation, and repository interfaces for interacting with loop data.

### `loopErrors.go`

This file defines custom errors related to loops in the Tracksale system. The errors include:
- `errPermissionNotFound`: Error indicating that create permission cannot be found in loops.
- `errTeamsNotFound`: Error indicating that user teams cannot be found.
- `errLoopsNotFound`: Error indicating that loops cannot be be listed.
- `errUsersNotFound`: Error indicating that responsibles cannot be found.

### `loopUseCase.go`

This file contains the implementation of the loop service in the Tracksale system. It includes the `LoopService` struct, which consists of various repositories and dependencies required for loop operations. Some of the key components are:
- `LoopService.env`: Environment configuration.
- `LoopService.nodeRepo`: Loop repository interface.
- `LoopService.logger`: Logger for logging.
- `LoopService.segmentRepo`: Segment repository interface.
- `LoopService.teamRepo`: Team repository interface.
- `LoopService.interRepo`: Interaction repository interface.
- `LoopService.orgRepo`: Organization repository interface.
- `LoopService.customerRepo`: Customer repository interface.
- `LoopService.upload`: Uploader interface.
- `LoopService.distRepo`: Distribution repository interface.
- `LoopService.metadataRepo`: Metadata repository interface.
- `LoopService.userRepo`: User repository interface.
- `LoopService.mu`: Mutex for synchronization.

The file also includes the `ToCSV` method for exporting loop data to CSV format.

### `loopInterfaces.go`

This file defines the `LoopRepositoryInterface`, which includes the following methods:
- `FindAllExport`: Method to find all loop exports based on filters, team UUIDs, user UUID, and loop UUID.
- `GetTicketTimelineData`: Method to get ticket timeline data for a loop based on dealt UUIDs.

### Design Patterns

The `loopUseCase.go` file follows the Repository pattern by defining interfaces for interacting with loop data. It also uses the Dependency Injection pattern to inject dependencies into the `LoopService` struct.

Overall, the `app/loop` package is structured to handle loop-related operations efficiently and maintainably within the Tracksale system.
---

## Loop Repository Components

- **File:** app/loop/repository/loopRepository.go
  - This file contains the `LoopRepository` struct and its methods used for interacting with the database and handling export functionality.
  - It includes imports for necessary packages such as `gorm`, `qfilter`, `cache`, and other internal packages.

- **File:** app/loop/repository/mocks/LoopRepositoryInterface.go
  - This file contains the mock implementation of the `LoopRepositoryInterface` for testing purposes.
  - It provides mock functions for `FindAllExport` and `GetTicketTimelineData` methods, which allow simulating behavior without actual database interactions.

## Interactions

- The `LoopRepository` struct interacts with the database using the `gorm` package to query and retrieve `LoopExport` data.
- It also utilizes the `qfilter` package to handle dynamic filtering based on provided parameters.
- The `cache` package is used for caching operations within the repository.

## Design Patterns

- The repository pattern is used to separate the data access logic from the rest of the application.
- Dependency injection is employed by passing the necessary database connection and cache interface to the `LoopRepository` struct.
- Mocking is utilized in testing through the `LoopRepositoryInterface` mock implementation to isolate the repository behavior from external dependencies.
---

## Metadata Domain

The `metadata.go` file in the `app/metadata/domain` package defines various constants, types, and a struct related to metadata in the application.

### Components
- `MetadataKind`, `MetadataType`, `MetadataDataType`: Enumerations representing different kinds of metadata, types of metadata, and data types of metadata respectively.
- Constants for `MetadataKind` and `MetadataType` representing different categories and types of metadata.
- `Metadata` struct: Struct representing metadata with fields for UUID, name, type, kind, data type, personal identifiable information, timestamps, and other metadata properties.

### Interactions
- The `Metadata` struct is used to store metadata information such as name, type, kind, timestamps, etc.
- The constants for `MetadataKind` and `MetadataType` help identify different categories and types of metadata.

## Metadata Repository

The `interfaces.go` and `MetadataRepositoryInterface.go` files in the `app/metadata/repository` and `app/metadata/repository/mocks` packages respectively are used for defining interfaces and mock implementations related to the metadata repository.

### Components
- `MetadataRepositoryInterface`: Interface defining methods for interacting with metadata in the repository. It includes methods like `FindAll`, `GetNameByUUID`, and `FindMetadataMap`.
- `MetadataRepositoryInterface` mock: Auto-generated mock implementation of the `MetadataRepositoryInterface` for testing purposes.

### Interactions
- The `MetadataRepositoryInterface` defines methods for finding all metadata, getting metadata name by UUID, and finding metadata in the form of a map.
- The mock implementation in `MetadataRepositoryInterface.go` provides mock functions for the defined interface methods for testing.

## Design Patterns
- The code follows the Repository pattern by separating the domain logic (metadata definitions) from the repository logic (CRUD operations on metadata).
- The code also uses the Mocking pattern for creating mock implementations of interfaces for testing purposes, ensuring testability and separation of concerns.
---

## Metadata Repository Components

### `metadataRepository` Struct
- This struct represents a metadata repository and contains a reference to a read-only GORM database connection.
- It includes methods for finding all metadata, getting a metadata name by UUID, and creating a map of metadata.

### Methods
1. `FindAll(opts qfilter.QFiltersParameters) ([]domain.Metadata, error)`
   - Retrieves all metadata based on the provided filtering options.
   
2. `GetNameByUUID(uuid string) (string, error)`
   - Retrieves the name of metadata based on the provided UUID.

3. `FindMetadataMap() (map[string]domain.Metadata, error)`
   - Retrieves metadata and maps them by UUID.

4. `NewMetadataRepository(nodeDBReadOnly *gorm.DB) *metadataRepository`
   - Creates a new instance of `metadataRepository` with the provided read-only GORM database connection.

## Organization Domain Components

### `Organization` Struct
- This struct represents an organization entity with various fields for organization details like UUID, name, logo, website, etc.

## Organization Repository Interface

### `OrganizationRepositoryInterface` Interface
- This interface defines methods for interacting with organization entities in the repository.
- It includes methods for retrieving organization language, information by UUID, schema name, etc.

### Methods
1. `GetOrganizationLanguageByUUID(uuid string) (string, error)`
   - Retrieves the language of an organization based on the provided UUID.

2. `GetOrganizationLanguageAndIdentificatorByUUID(ctx context.Context, uuid string) (domain.OrganizationLangIdentificator, error)`
   - Retrieves both the language and identificator of an organization based on the provided UUID.
   
3. `GetOrganizationIdentificatorBySchemaName(schemaName string) (string, error)`
   - Retrieves the identificator of an organization based on the provided schema name.

4. `GetOrganizationByUUID(ctx context.Context, uuid string) (domain.Organization, error)`
   - Retrieves the organization entity based on the provided UUID.

5. `GetOrgSchemaNameByUUID(context.Context, string) (string, error)`
   - Retrieves the schema name of an organization based on the provided UUID.

6. `GetOrganizationExportSimplified(ctx context.Context, uuid string) (domain.OrganizationExportSimplified, error)`
   - Retrieves simplified export information for an organization based on the provided UUID.

Design Patterns Used:
- The repository pattern is used to separate the data access logic from the business logic, allowing for easier management and testing of database operations.
- The interface pattern is used to define a set of methods that a repository must implement, providing a contract for interacting with organization entities.
---

## Organization Repository Components

### `OrganizationRepositoryInterface`

- This is an autogenerated mock type for the `OrganizationRepositoryInterface`.
- It includes mock functions like `GetOrgSchemaNameByUUID`, `GetOrganizationByUUID`, and `GetOrganizationExportSimplified`.

### `OrganizationRepository`

- This is the main repository for handling organization-related data.
- It includes functions like `GetOrgSchemaNameByUUID`, `GetOrganizationByUUID`, and `GetOrganizationIdentificatorBySchemaName`.
- It interacts with the coreDBReadOnly database, cache, and the domain package.

### `Segment`

- Defines the structure of a Segment entity with fields like UUID, UserUUID, Name, Rules, Type, CreatedAt, ModifiedAt, and DeletedAt.
- Includes constants for different types of segments like Customer, Interaction, and Loop.

## Interactions

- The `OrganizationRepositoryInterface` provides mocked implementations of functions like `GetOrgSchemaNameByUUID` and `GetOrganizationByUUID`.
- The `OrganizationRepository` interacts with the core database through `coreDBReadOnly` and cache using `cache`.
- The repository fetches organization data based on UUID, schema name, and other identifiers.
- The `Segment` domain entity defines the structure of a segment with rules and types for different segment types.

## Design Patterns

- The repository pattern is used for separating data access logic from business logic.
- Mocking is implemented for testing purposes using the `OrganizationRepositoryInterface` mock type.
- The segment entity follows a standard domain-driven design structure with a clear separation of concerns.
---

## app/segment/errors.go

This file contains a package level variable `errSegmentsNotFoundMsg` with a value "Can't find any segment".

## app/segment/interfaces.go

This file defines the `SegmentRepositoryInterface` interface in the `segment` package. The interface has a method `FindByUUID` which takes a UUID string and a map of conditions as inputs and returns a `domain.Segment` object along with an error.

## app/segment/mocks/SegmentRepositoryInterface.go

This file is generated by mockery v2.42.3 and contains a mock implementation of the `SegmentRepositoryInterface` interface. It includes a struct `SegmentRepositoryInterface` with a `FindByUUID` method that can be used for testing purposes.

### Interactions

- The `errors.go` file provides an error message for segments not found.
- The `interfaces.go` file defines the `SegmentRepositoryInterface` which can be implemented by other structs to handle operations related to segments.
- The `mocks/SegmentRepositoryInterface.go` file provides a mock implementation of the `SegmentRepositoryInterface` interface for testing purposes.

### Design Patterns Used

- Repository Pattern: The `SegmentRepositoryInterface` interface follows the repository design pattern, acting as an abstraction layer for data access operations related to segments.
- Mocking Pattern: The `mocks/SegmentRepositoryInterface.go` file utilizes mocking to create a mock implementation of the `SegmentRepositoryInterface` interface for testing purposes.
---

## Segment Repository and UseCase

### Components

- **SegmentRepository:** This component is responsible for handling database operations related to segments. It contains a method to find a segment by UUID, along with optional conditions.
- **SegmentService:** This component is the business logic layer that interacts with the SegmentRepository. It provides methods to get segment rules and fetch a single segment by UUID and user UUID.
- **SentimentAnalysisRepositoryInterface:** This interface defines the contract for retrieving InteractionSentimentAnalysis data based on filters.

### Interactions

1. The SegmentService calls the SegmentRepository to fetch a segment by UUID and user UUID.
2. The SegmentRepository interacts with the database to retrieve the segment data based on the provided UUID and conditions.
3. The SentimentAnalysisRepositoryInterface provides a method to retrieve InteractionSentimentAnalysis data based on specified filters.

### Design Patterns

- **Repository Pattern:** The SegmentRepository follows the repository pattern by abstracting the database operations for segments.
- **Dependency Injection:** The SegmentService utilizes dependency injection to receive an instance of the SegmentRepositoryInterface and a logger.
- **Error Handling:** The SegmentService handles errors returned by the SegmentRepository and constructs appropriate AppError responses based on the type of error.

```go
// Code samples for clarity
// app/segment/repository.go
type SegmentRepository struct {
    nodeDBReadOnly *gorm.DB
}

func (repo *SegmentRepository) FindByUUID(UUID string, conditions map[string]interface{}) (domain.Segment, error) {
    // Method implementation
}

func NewSegmentRepository(nodeDBReadOnly *gorm.DB) *SegmentRepository {
    // Constructor implementation
}

// app/segment/useCase.go
type SegmentService struct {
    nodeRepo SegmentRepositoryInterface
    logger   *zap.Logger
}

func (svc *SegmentService) GetRulesByUUID(UUID string, userUUID string) (qfilter.SegmentRules, *pkgCommon.AppError) {
    // Method implementation
}

func NewSegmentService(nodeRepository SegmentRepositoryInterface, logger *zap.Logger) *SegmentService {
    // Constructor implementation
}

// app/sentimentAnalysis/interfaces.go
type SentimentAnalysisRepositoryInterface interface {
    GetAllByInteractions(filters *qfilter.QFiltersParameters) ([]domain.InteractionSentimentAnalysis, error)
}
```
---

## Sentiment Analysis Components

### SentimentAnalysisRepositoryInterface

The `SentimentAnalysisRepositoryInterface` is a mock type generated by mockery v2.42.3 for the `SentimentAnalysisRepositoryInterface` type. It provides a mock function `GetAllByInteractions` with the given fields `filters`. This interface is used for testing purposes to mock interactions with the actual `SentimentAnalysisRepositoryInterface`.

### sentimentAnalysisRepository

The `sentimentAnalysisRepository` is the implementation of the `SentimentAnalysisRepositoryInterface`. It includes the method `GetAllByInteractions` which retrieves interaction sentiment analysis data based on the provided filters. This repository interacts with the `nodeDBReadOnly` database using GORM and the `qfilter` package for filtering.

### QuestionCES

The `QuestionCES` struct is part of the survey domain and represents a CES (Customer Effort Score) question entity. It includes various properties such as UUID, question, description, scale details, button design, created timestamp, etc. It also defines validation rules for each property using struct tags.

## Interactions

The `SentimentAnalysisRepositoryInterface` mock is used for testing the interactions with the `sentimentAnalysisRepository` when retrieving interaction sentiment analysis data.

The `sentimentAnalysisRepository` interacts with the database using GORM to fetch interaction sentiment analysis based on the provided filters through the `GetAllByInteractions` method.

## Design Patterns

The code follows the repository pattern for separating data access logic from business logic. The `SentimentAnalysisRepositoryInterface` defines the contract for interacting with sentiment analysis data, while the `sentimentAnalysisRepository` implements this contract and handles the database interactions using GORM.

The code also demonstrates the use of mocking for testing purposes, ensuring that the interactions with the repository are well-tested and reliable.

```go
// Code samples will go here for each file
```

This documentation provides an overview of the components, their interactions, and the design patterns used in the sentiment analysis module of the CXM export application.
---

## Survey Domain Components

### `ces2.go`

The `QuestionCES2` struct represents a CES 2.0 survey question. It includes the following fields:
- `UUID`: Unique identifier of the question.
- `Question`: A JSON property representing the question text.
- `Description`: A JSON property representing additional description for the question.
- `IsObligatory`: Boolean flag indicating if the question is obligatory.
- `QuestionMetadataUUID`: Optional UUID for question metadata.
- `MinScale`: Minimum scale value (must equal 1).
- `MaxScale`: Maximum scale value (must be either 5 or 7).
- `ColorPattern`: Integer representing color pattern options.
- `CustomColor`: Optional custom color in hex format.
- `CommentQuestion`: A JSON property for a follow-up comment question.
- `CommentMetadataUUID`: Optional UUID for comment metadata.
- `ScaleType`: Enum representing the scale type (0, 1, or 2).
- `ButtonDesign`: Integer representing button design options.
- `ButtonSubtitleMin`: A JSON property for minimum button subtitle text.
- `ButtonSubtitleMax`: A JSON property for maximum button subtitle text.
- `CreatedAt`: Timestamp of creation.

### `csat.go`

The `QuestionCSAT` struct represents a CSAT survey question. It has similar fields to the `QuestionCES2`, with slight differences in scale values:
- `MinScale`: Minimum scale value (must be either 0 or 1).
- `MaxScale`: Maximum scale value (must be either 5 or 10).

### `emoji.go`

The `QuestionEmoji` struct represents an emoji-based survey question. It has fields similar to the other question types, with the following differences:
- `MaxScale`: Maximum scale value (must equal 5).

### Interactions

These domain structs handle the definitions of different types of survey questions (CES 2.0, CSAT, and emoji-based). They provide a consistent way to represent survey question data within the application. 

### Design Patterns Used

The code follows the domain-driven design pattern where each struct represents a specific domain concept (survey question type) with its own set of properties and validation rules. The use of a common `commonJson` package for JSON properties highlights code reusability and maintainability.

```go
// Sample usage of the QuestionCES2 struct
question := QuestionCES2{
    UUID: "123",
    Question: commonJson.JsonProperty{
        en: "How likely are you to recommend our service?",
        pt: "Quão provável é que você recomendaria nosso serviço?",
    },
    IsObligatory: true,
    MinScale: 1,
    MaxScale: 5,
    ColorPattern: 1,
    CustomColor: "#FF0000",
    ScaleType: 1,
    ButtonDesign: 3,
    CreatedAt: time.Now().Unix(),
}
```
---

## Survey Domain Components

### SurveyItemImage
- `SurveyItemImage` struct represents an image associated with a survey item.
- Attributes:
  - `UUID`: A unique identifier for the image.
  - `URL`: The URL of the image.
  - `Align`: The alignment of the image.
  - `CreatedAt`: Timestamp indicating when the image was created.
  
### SurveyItemImageReq
- `SurveyItemImageReq` struct defines the required fields for creating a survey image.
- Attributes:
  - `UUID`: Unique identifier for the image (primary key).
  - `URL`: URL of the image (base64 or URI format).
  - `Extension`: File extension (e.g., jpg, jpeg, png, gif).
  - `Align`: Alignment of the image (left, center, right).
  - `CreatedAt`: Timestamp indicating when the image was created.

### SurveyItemLabel
- `SurveyItemLabel` struct represents a label associated with a survey item.
- Attributes:
   - `UUID`: Unique identifier for the label (primary key).
   - `Question`: JSON property representing the label text.
   - `CreatedAt`: Timestamp indicating when the label was created.

### QuestionMultipleChoice
- `QuestionMultipleChoice` struct represents a multiple-choice question in a survey.
- Attributes:
  - `UUID`: Unique identifier for the question (primary key).
  - `Question`: JSON property representing the question text.
  - `Description`: JSON property representing the question description (optional).
  - `IsObligatory`: Indicates if the question is obligatory.
  - `Options`: Array of JSON properties representing the multiple-choice options.
  - `OptionOther`: Indicates if an "other" option is available.
  - `OptionOtherMetadataUUID`: UUID for metadata related to the "other" option.
  - `Randomize`: Indicates if the options are randomized.
  - `QuestionMetadataUUID`: UUID for metadata related to the question.
  - `HorizontalAlign`: Indicates if options should be horizontally aligned.
  - `MultipleAnswers`: Indicates if multiple answers are allowed.
  - `CommentQuestion`: JSON property representing the comment question.
  - `CommentMetadataUUID`: UUID for metadata related to comments.
  - `CreatedAt`: Timestamp indicating when the question was created.

### Interactions
- The `SurveyItemImage`, `SurveyItemLabel`, and `QuestionMultipleChoice` structs are part of the survey domain in the application and store information related to images, labels, and multiple-choice questions, respectively.
- These components are used to structure and manage data within the survey module of the application.

### Design Patterns
- The code makes use of struct composition and validation tags (`validate`) to define and validate the attributes of each domain struct.
- The `QuestionMultipleChoiceOptions` custom type is used to represent multiple-choice options as an array of JSON properties.
- Implementations of the `Value()` and `Scan()` methods for `QuestionMultipleChoiceOptions` enable database operations involving JSON serialization and deserialization.
---

## Survey Domain Components

### NPS Relational Survey

The `QuestionNPSRelational` struct represents a question in a Net Promoter Score (NPS) relational survey. It includes properties such as the UUID, question, description, obligatory flags for detractors, neutrals, and promoters, metadata UUIDs, scale range, comment rule, comment questions for different responses, color pattern, custom color, and scale inversion. 

### NPS Transactional Survey

The `QuestionNPSTransactional` struct represents a question in an NPS transactional survey. It has similar properties to the `QuestionNPSRelational` struct but includes an additional field for the comment rule as an integer type `QCommentRule`.

### Open-Ended Question

The `QuestionOpen` struct represents an open-ended question in a survey. It includes properties such as the UUID, question, obligatory flag, metadata UUID, and creation timestamp.

## Interactions

- Both the NPS Relational and NPS Transactional surveys share common properties for the questions, such as UUID, question, description, obligatory flags, scale range, comment questions, color settings, and scale inversion.
- The open-ended question is separate and includes properties specific to open-ended responses, such as the creation timestamp.

## Design Patterns

- Object-Oriented Design: The use of structs allows for encapsulation of survey question properties.
- Validation: The `validate` tags in the struct fields indicate the validation rules for each property.
- Composition: The `commonJson.JsonProperty` type is used to represent question and comment properties, promoting code reuse and maintainability.
---

# CXM Export Survey Domain Components

## `ratings.go`
This file defines the `QuestionRating` struct, which represents a question rating in a survey. It includes fields such as UUID, question, description, IsObligatory, MinScale, MaxScale, ColorPattern, CustomColor, ButtonDesign, CommentQuestion, CommentMetadataUUID, and CreatedAt.
Design Patterns Used:
- Structuring of the data model using gorm tags for database mapping
- Validation of fields using the validate tag

```go
type QuestionRating struct {
	UUID                 string                  `gorm:"primary_key" json:"uuid" validate:"nullAble|uuid"`
Question             commonJson.JsonProperty `json:"question" validate:"jsonLang"`
Description          commonJson.JsonProperty `json:"description" validate:"nullAble|jsonLang"`
IsObligatory         bool                    `json:"is_obligatory" validate:"nullAble|required"`
QuestionMetadataUUID *string                 `json:"question_metadata_uuid,omitempty"`
MinScale             int                     `json:"min_scale" validate:"eq=1,numeric"`
MaxScale             int                     `json:"max_scale" validate:"lte=10,numeric"`
ColorPattern         int                     `json:"color_pattern" validate:"oneof=1 2 3,numeric"`
CustomColor          string                  `json:"custom_color" validate:"nullAble|hexcolor"`
ButtonDesign         int                     `json:"button_design" validate:"gte=1,lte=4,numeric"`
CommentQuestion      commonJson.JsonProperty `json:"comment_question"  validate:"jsonLang"`
CommentMetadataUUID  *string                 `json:"comment_metadata_uuid"`
CreatedAt            int64                   `json:"created_at"`
}
```

## `survey.go`
This file contains the `Survey` and `InteractionSurvey` structs, which represent a survey and an interaction survey respectively. The `Survey` struct includes fields such as UUID, Status, UserUUID, Logo, Inbox, PublicHash, Name, Channel, PrimaryColor, SecondaryColor, BackgroundColor, Message, Description, EndingImage, LiveEditor, Title, Subtitle, Socials, Lang, DefaultLang, and SurveyItems.
Design Patterns Used:
- Separation of survey items into an array
- Utilization of gorm tags for database mapping

```go
type InteractionSurvey struct {
UUID           string `json:"uuid" gorm:"primary_key"`
Name           string `json:"name"`
DefaultLang    string `json:"default_lang"`
TotalQuestions int64  `json:"total_questions"`
}

type Survey struct {
UUID                   string                       `json:"uuid" gorm:"primary_key"`
Status                 SurveyStatus                 `json:"status"`
UserUUID               string                       `json:"user_uuid"`
Logo                   string                       `json:"logo,omitempty" gorm:"-"`
Inbox                  *string                      `json:"inbox"`
PublicHash             string                       `json:"public_hash"`
Name                   string                       `json:"name"`
Channel                DistributionChannel          `json:"channel"`
PrimaryColor           *string                      `json:"primary_color"`
SecondaryColor         *string                      `json:"secondary_color"`
BackgroundColor        *string                      `json:"background_color"`
Message                *string                      `json:"message"`
Description            *string                      `json:"description"`
EndingImage            *string                      `json:"ending_image"`
LiveEditor             commonJson .JsonProperty     `json:"live_editor"`
Title                  commonJson .JsonProperty     `json:"title"`
Subtitle               commonJson .JsonProperty     `json:"subtitle"`
Socials                commonJson .JsonProperty     `json:"socials"`
Lang                   commonJson .JsonArrayProperty `json:"lang"`
DefaultLang            string                       `json:"default_lang"`
SurveyItems            []SurveyItem                 `json:"items,omitempty" gorm-"`
CooldownDistributi
... [truncated due to size]
```

## `surveyItemJumpRule.go`
This file includes the `ActionType` enum, which represents different types of actions that can be associated with survey items in terms of jump rules.

```go
package domain

type ActionType int
```
---

## Survey Domain Components

### SurveyItems (surveyItems.go)
This file defines the types of survey items supported by the system. It includes constants for different types of survey items like CES, CSAT, Emoji, Multiple Choice, and others. The `SurveyItemXlsxInteractionExport` struct represents an exported survey item with details like UUID, survey UUID, question, item type, and other fields. The `SurveyItemPermittedSurveys` struct represents a survey item permitted for specific surveys, including details like UUID, survey UUID, item UUID, type, and other related information.

### SurveyMetadata (surveyMetadata.go)
This file defines metadata types and structures related to surveys. It includes constants for metadata types like Customer and Interaction. The `SurveyMetaDataPerType` struct represents metadata specific to customers, interactions, and identifiers. The `SurveyMetaDataWithName` struct provides details for metadata with attributes like UUIDs, names, types, and default answer options. The `SurveyMetaData` struct represents generic metadata with fields like UUID, required status, created at time, and deletion flag.

### Thumbs (thumbs.go)
This file handles thumbs-related functionality for survey questions. It defines constants for thumbs like Dislike and Like. The `QuestionThumbs` struct represents a question with attributes such as UUID, question text, obligatory status, comment questions for promoters and detractors, metadata UUIDs, and creation time.

### Interactions between Components
- SurveyItems and SurveyMetadata components are related as survey items may have metadata associated with them.
- SurveyMetadata and Thumbs components are related as metadata may be used in defining thumbs-related functionality.
- SurveyItems and Thumbs components are loosely related as survey items may include thumbs-related questions, though not directly tied.

### Design Patterns
- The code follows a structured approach by organizing components into separate files based on functionality.
- Constants are defined for better readability and maintainability of the code.
- Structs are used to encapsulate related data fields and provide a clear representation of survey items, metadata, and thumbs.
---

## Survey Repository Components

### SurveyRepositoryInterface
- This interface defines the methods that any concrete survey repository implementation must implement.
- It includes methods such as `FindAllByInteractions`, `CountQuestions`, `FindByUUID`, `FindAllExport`, etc.

### SurveyRepository
- This struct implements the SurveyRepositoryInterface.
- It includes methods for counting questions in a survey, finding all interactions, and finding all exports.
- Uses GORM for database operations and implements caching for performance improvement.
- Defines private variables like `surveyByUuid`, `surveyItemsBySurveyUuid` for caching purposes.

## Interactions

- The `SurveyRepositoryInterface` serves as the contract that any interacting class must follow to work with the survey repository.
- The `SurveyRepository` class implements the methods defined in the `SurveyRepositoryInterface` for interacting with the survey data.

## Design Patterns
- **Repository Pattern**: The SurveyRepository serves as the repository for survey-related data, abstracting the data access logic from the rest of the application.
- **Mocking Pattern**: The `SurveyRepositoryInterface` in the `mocks` package is a generated mock type using mockery v2.53.4, allowing for easy mocking of the repository interface for testing purposes.

```go
// Sample code snippet from app/survey/repository/interfaces.go
type SurveyRepositoryInterface interface {
    FindAllByInteractions(filters *qfilter.QFiltersParameters) ([]domain.InteractionSurvey, error)
    CountQuestions(ctx context.Context, surveyUUID string) (int64, error)
    ...
}

// Sample code snippet from app/survey/repository/repository.go
func (repo *SurveyRepository) CountQuestions(ctx context.Context, surveyUUID string) (int64, error) {
    ...
}

func (repo *SurveyRepository) FindAllByInteractions(filters *qfilter.QFiltersParameters) ([]domain.InteractionSurvey, error) {
    ...
}
```
---

## Survey Service Components

The `SurveyService` struct in the `usecase.go` file consists of the following components:

- **env**: Holds the environment configuration.
- **custSVC**: Instance of the `CustomerService` struct from the `customer` package.
- **interSVC**: Instance of the `InteractionService` struct from the `interaction` package.
- **nodeRepo**: Implementing the `SurveyRepositoryInterface` from the `survey` package.
- **mdRepo**: Implementing the `MetadataRepositoryInterface` from the `metadata` package.
- **teamRepo**: Implementing the `TeamRepositoryInterface` from the `team` package.
- **segmentRepo**: Implementing the `SegmentRepositoryInterface` from the `segment` package.
- **interactionRepo**: Implementing the `InteractionRepositoryInterface` from the `interaction` package.
- **distributionRepo**: Implementing the `DistributionRepositoryInterface` from the `distribution` package.
- **orgRepo**: Implementing the `OrganizationRepositoryInterface` from the `organization` package.
- **userRepo**: Implementing the `UserRepositoryInterface` from the `user` package.
- **custRepo**: Implementing the `CustomerRepositoryInterface` from the `customer` package.
- **logger**: Instance of the Zap logger.
- **WaitGroup**: Allows for synchronization using a `sync.WaitGroup`.
- **loopRepo**: Instance of the `LoopRepository` from the `loop` package.

These components work together to provide functionality related to surveys in the system.

## Team Domain Components

### Team Struct

The `Team` struct in the `team.go` file defines the structure of a team in the system. It includes the following fields:

- **UUID**: Unique identifier for the team.
- **ParentUUID**: Optional reference to the parent team's UUID.
- **Name**: Name of the team.
- **Color**: Color associated with the team.
- **Root**: Boolean indicating if the team is a root team.
- **MetadataPermissions**: JSON property for metadata permissions.
- **SsoDefault**: Boolean indicating if the team is the default SSO team.
- **CreatedAt**: Unix timestamp of when the team was created.
- **ModifiedAt**: Optional Unix timestamp of when the team was last modified.
- **DeletedAt**: Optional Unix timestamp of when the team was deleted.
- **MembersUUID**: A field not stored in the database, holding UUIDs of team members.
- **Description**: Description of the team.
- **HasLoop**: Boolean indicating if the team has loop.

### TeamSurveyPermissions Struct

The `TeamSurveyPermissions` struct in the `teamSurveyPermissions.go` file represents the permissions for a team on a specific survey. It includes the following fields:

- **UUID**: Unique identifier for the permissions.
- **TeamUUID**: UUID of the team.
- **SurveyUUID**: UUID of the survey.
- **CreatedAt**: Unix timestamp of when the permissions were created.
- **DeletedAt**: Optional Unix timestamp of when the permissions were deleted.

These components define the structure of teams and their permissions in the system.
---

## Team Package

### Components

1. **app/team/interfaces.go**
   - Contains the `TeamRepositoryInterface` interface which defines methods related to team repositories such as getting metadata permissions for a user, getting survey permissions by user, user permissions, getting teams by user UUID, verifying team attributes by teams UUIDs, and verifying team attributes type.

2. **app/team/mocks/TeamRepositoryInterface.go**
   - Mock implementation generated by mockery v2.49.0 for the `TeamRepositoryInterface` interface. Contains mock functions for various methods defined in the interface.

3. **app/team/repository.go**
   - Implements the methods defined in the `TeamRepositoryInterface` interface.
   - Contains the `teamRepository` struct with fields `logger` and `nodeDBReadOnly`.
   - Provides functionality to verify team attributes by teams UUIDs, verify team attributes type, get consolidated metadata permissions for a user, and other related operations.

### Interactions

- The `TeamRepositoryInterface` interface defines the contract for interacting with team repositories.
- The `teamRepository` struct implements the methods defined in the interface and interacts with the database (using `gorm`) to perform operations related to team attributes and metadata permissions.
- Mocks are generated for testing purposes and provide mocked implementations of the interface methods.

### Design Patterns

- **Repository Pattern**: The repository pattern is used to separate the data access logic from the business logic in the `teamRepository` struct. Each method in the repository handles specific data access operations related to teams.
- **Mocking Pattern**: Mocking is used for testing the interface methods by generating mock implementations in the `mocks` package. This allows for controlled testing of the repository methods without interacting with the actual database.

```go
// Sample code snippet from repository.go
func (repo *teamRepository) VerifyTeamAttributesByTeamsUUIDs(teamUUID []string) (string, error) {
    // Method implementation
}

func (repo *teamRepository) GetConsolidatedMetadataPermissions(userUUID string) (map[string]bool, error) {
    // Method implementation
}
```
---

## User Domain and Repository

### File: app/user/domain/user.go

The `user.go` file in the `domain` package defines several structs related to the User domain. These structs include:
- `UserPrimaryLanguageAndLocation`: Contains fields for the user's primary language and time offset.
- `User`: Represents a user entity with various attributes such as UUID, email, password, name, phone, country code, and others. It also includes a reference to the `Team` struct from the `teamDomain`.

### File: app/user/repository/interfaces.go

The `interfaces.go` file in the `repository` package defines the `UserRepositoryInterface` interface, which contains the following methods:
- `GetUserPrimaryLanguageAndLocation`: Retrieves the primary language and location information of a user based on their UUID.
- `GetUsersByUUIDs`: Retrieves a list of user entities based on a list of UUIDs.
- `GetUserPersonalData`: Retrieves personal data of a user based on their UUID.

### File: app/user/repository/mocks/UserRepositoryInterface.go

The `UserRepositoryInterface.go` file in the `mocks` package contains mock implementations of the `UserRepositoryInterface` interface generated by the `mockery` tool. It provides mocked implementations for the methods defined in the `UserRepositoryInterface` interface.

### Interactions

- The `User` struct within the `user.go` file interacts with the `Team` struct from the `teamDomain` package through the `Teams` field.
- The `UserRepositoryInterface` interface in the `interfaces.go` file defines methods for interacting with user data, such as retrieving user details and personal data.
- The mock implementations in the `UserRepositoryInterface.go` file are used for testing and mocking interactions with the user repository without actually hitting the database.

### Design Patterns Used

- The code follows a domain-driven design approach by organizing user-related entities and logic within the `domain` package.
- The repository pattern is used to abstract data access and provide a clear separation between domain logic and data access code.
- Mock objects are used for testing purposes to isolate the behavior of the `UserRepositoryInterface` methods from the actual database interactions.
---


# CXM-Export Repository Documentation

## app/user/repository/repository.go

This file contains the implementation of the user repository in the CXM-Export application. It defines a `userRepository` struct with methods to interact with the database for retrieving user information.

### Components
- `userRepository struct`: Represents the user repository with a `coreDBReadOnly` attribute of type `*gorm.DB`.
- `GetUserPrimaryLanguageAndLocation`: Method to get a user's primary language and location based on their `UUID`.
- `GetUsersByUUIDs`: Method to get multiple users by their `UUIDs`.
- `GetUserPersonalData`: Method to retrieve a user's personal data (name and email) using their `UUID`.
- `NewUserRepository`: Constructor function to create a new instance of the `userRepository`.

### Interactions
- The `userRepository` interacts with the database using the `coreDBReadOnly` connection to perform CRUD operations on the `users` table.
- Methods like `GetUserPrimaryLanguageAndLocation`, `GetUsersByUUIDs`, and `GetUserPersonalData` fetch specific user information from the database based on the provided criteria.

### Design Patterns
- Repository Pattern: This file follows the repository pattern by encapsulating the data access logic for the user entity within the `userRepository` struct. This promotes separation of concerns and maintainability of the code.

```go
// Sample code from repository.go
type userRepository struct {
	coreDBReadOnly *gorm.DB
}

func (r *userRepository) GetUserPrimaryLanguageAndLocation(uuid string) (domain.UserPrimaryLanguageAndLocation, error) {
    // Method implementation
}

func NewUserRepository(coreDBReadOnly *gorm.DB) *userRepository {
    return &userRepository{
        coreDBReadOnly: coreDBReadOnly,
    }
}
```

## cd/prod/deployment.yaml

This file defines a Kubernetes Deployment configuration for the production environment of the CXM-Export application.

### Components
- `Deployment`: Kubernetes resource specifying the deployment configuration.
- `Containers`: Configuration for the container running the `cxm-export-prod` application.
- `Resources`: Resource requests and limits for memory and CPU.
- `EnvFrom`: Environment variables sourced from a secret.
- `Affinity`: Node affinity settings for pod scheduling.
- `Tolerations`: Taint tolerations for the pod.

### Interactions
- The deployment ensures that two replicas of the `cxm-export-prod` application are running with specified resource constraints and environment settings.
- The container image is pulled from a specified repository, and environment variables are populated from the secret specified.

```yaml
# Sample code from deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cxm-export-prod
  namespace: cxm
  ...
```

## cd/prod/secret.yaml

This file defines an ExternalSecret resource for storing sensitive data used in the production environment of the CXM-Export application.

### Components
- `ExternalSecret`: Custom resource for managing external secrets securely.
- `Data`: Mapping of secret keys to their respective remote references.
- `SecretStoreRef`: Reference to the secret store used to securely store the secrets.

### Interactions
- The ExternalSecret resource specifies the secret keys and their corresponding remote references from a Vault secret store.
- This allows the application to securely access sensitive data such as database credentials, AWS configurations, and other environment-specific settings.

```yaml
# Sample code from secret.yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: cxm-export-prod
  namespace: cxm
  ...
```

These files collectively define the user repository, deployment configuration, and secret management for the CXM-Export application in the production environment. The repository manages user data access, the deployment ensures the application's availability and scalability, and the secret management secures sensitive information used by the application.
---

## CXM Export Service Architecture

### cd/prod/service.yaml

The `service.yaml` file defines a Kubernetes Service named `cxm-export-prod` in the `cxm` namespace. This service is labeled with `app: cxm-export-prod` and `platifyx.io/managed: "true"`. It is of type ClusterIP with a single port configuration for TCP port 80. The service selector is set to `app: cxm-export-prod`.

### cd/stage/deployment.yaml

The `deployment.yaml` file specifies a Kubernetes Deployment for `cxm-export` in the `cxm` namespace under the `stage` environment. The deployment has one replica and is configured with a Recreate strategy. The pod template includes a container named `cxm-export` that pulls the image `445567085385.dkr.ecr.us-east-1.amazonaws.com/cxm-export:13979` with container port 8080 exposed. Resource limits and requests are set for memory and CPU usage. The container also includes environment variables sourced from a secret named `cxm-export` and defines readiness and liveness probes for health checking.

### cd/stage/secret.yaml

The `secret.yaml` file defines an ExternalSecret named `cxm-export` in the `cxm` namespace for the `stage` environment. It specifies a refresh interval of 1 hour and references a ClusterSecretStore named `vaultstageexternalsecret`. The secret data includes various key-value pairs sourced from remote secrets for configuration parameters related to AWS, email settings, database connections, and health checks.

### Interactions

The `service.yaml` file provides network access to the `cxm-export` service running in the cluster. The `deployment.yaml` file ensures the deployment of the `cxm-export` container with specified configurations and handles the pod lifecycle. The `secret.yaml` file stores sensitive data and configuration parameters securely, providing the necessary secrets to the `cxm-export` container during runtime.

### Design Patterns Used

- Service: The Service resource in `service.yaml` enables network connectivity to the `cxm-export` application within the Kubernetes cluster.
- Deployment: The Deployment resource in `deployment.yaml` handles the deployment and scaling of the `cxm-export` container.
- ExternalSecret: The ExternalSecret resource in `secret.yaml` follows a pattern to securely store and access external secrets for the `cxm-export` application, maintaining separation of concerns for sensitive data.
- Health Checks: The deployment configuration includes readiness and liveness probes to monitor the health of the `cxm-export` container and ensure uninterrupted operation.

These files collectively form the architecture for the CXM Export service in a Kubernetes environment, providing a scalable, secure, and reliable solution for exporting data.
---

### Repository: Tracksale/cxm-export

---

#### **Components**

1. **Service Account (cd/stage/service-account.yaml)**
   - **Description:** Defines a service account named "cxm-export" in the "cxm" namespace with annotations specifying the role ARN.
  
   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: cxm-export
     namespace: cxm
     annotations:
       eks.amazonaws.com/role-arn: arn:aws:iam::445567085385:role/cxm-export
   ```

2. **Service (cd/stage/service.yaml)**
   - **Description:** Defines a service for "cxm-export" in the "cxm" namespace with specific labels and ports.
  
   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: cxm-export
     namespace: cxm
     labels:
       app: cxm-export
       environment: stage
   spec:
     type: ClusterIP
     ports:
       - name: cxm-export
         protocol: TCP
         port: 8080
         targetPort: 8080
     selector:
       app: cxm-export
       environment: stage
   ```

3. **Pipeline Configuration (ci/pipeline.yml)**
   - **Description:** Defines a pipeline configuration with variables, triggers, resources, and stages for the Azure DevOps build process.

   ```yaml
   name: $(Build.BuildId)

   trigger:
     branches:
       include:
         - stage
     paths:
       exclude:
         - cd/*
         - ci/*
         - Dockerfile

   variables:
     - group: variables
     - name: appname
       value: 'cxm-export'
     - name: apppath
       value: '.'
     - name: Dockerfile
       value: 'Dockerfile'
     - name: microservices
       value: 'yes'
     - name: monorepo
       value: 'no'
     - name: language
       value: 'go'
     - name: version
       value: '1.23.0'
     - name: testun
       value: 'yes'
     - name: infra
       value: 'kube'
     - name: image
       value: 'golang:1.23.0-alpine3.20,alpine:3.12.1'
     - name: squad
       value: 'cxm'

   resources:
     repositories:
       - repository: pipeline
         type: git
         name: Joker/pipeline
         ref: refs/heads/main
         endpoint: azure-devops-indecx
   stages:
     - template: kubernetes.yml@pipeline
   ```

---

#### **Interactions**

- The Service Account "cxm-export" is used to provide permissions and access control for the service.
- The Service "cxm-export" exposes the application under the namespace "cxm" in the Kubernetes cluster.
- The Pipeline Configuration defines the build process steps and dependencies, including variables, triggers, resources, and stages for the Azure DevOps pipeline.

---

#### **Design Patterns**

- **Service-Oriented Architecture (SOA):** The use of Service Account and Service components follows the SOA design pattern, where each service is independently deployable and interacts with other services.

- **Microservices Architecture:** The configuration in the Pipeline YAML file indicates the use of microservices by setting the "microservices" variable to 'yes', enabling the management of smaller, decoupled services.

- **Infrastructure as Code (IaC):** The Pipeline Configuration file enforces IaC practices by defining the entire build process as code, allowing for automated provisioning and deployment of infrastructure resources.

- **Labeling and Selectors:** The Service component uses labels and selectors to group related resources together, following the Kubernetes best practices for resource identification and selection.

---
---

## Repository: Tracksale/cxm-export

### Focused Section: Common Utility Functions

The `common` directory in this section contains utility functions that can be used across the application for different purposes.

#### File: common/apperrors/config-errors.go

- This file defines custom error variables related to application configuration errors.
- `ErrEnvFileNotFound`: Indicates an error when the environment file is not found.
- `ErrEnvVarNotFound`: Indicates an error when a specific environment variable is not provided.
- `ErrMissingVariables`: Indicates a general error when certain variables are not set.

#### File: common/arrayUtil.go

- This file contains various utility functions for working with arrays and maps.
- `ContainsString(arr []string, i string) bool`: Checks if a specific string is present in an array of strings.
- `GetSortedKeyMap(mapStr map[string]string) []string`: Sorts the keys of a map of strings based on numeric values within the keys.
- `IsValidKey(field string, key string, keys map[string][]string) bool`: Checks if a specific key is a valid key for a given field based on a map of keys.
- `IsZeroVal(params ...interface{}) bool`: Checks if the primary key has a zero value and handles multiple parameters for comparison.

### Interactions

- These utility functions can be used in various parts of the application to handle errors, manipulate arrays, and validate keys.
- The `ErrEnvFileNotFound` and `ErrEnvVarNotFound` errors can be used to handle issues related to loading environment variables.
- The `ContainsString` function can be used to check for the presence of certain strings in arrays.
- The `GetSortedKeyMap` function can help in sorting keys within a map.
- The `IsValidKey` function can assist in validating keys for specific fields.
- The `IsZeroVal` function is useful for checking if a primary key has a zero value.

### Design Patterns

- The utility functions follow common design patterns such as error handling, validation, and sorting.
- The use of custom error variables in `config-errors.go` follows the pattern of defining specific error types for easier error handling.
- The array manipulation functions in `arrayUtil.go` follow patterns like iteration, comparison, and sorting for efficient array operations.

Overall, the utility functions in the `common` directory provide essential tools for working with arrays, maps, and error handling within the application.
---

## Common Components

### constants.go

The `constants.go` file contains various constants used within the cxm-export application. These constants include:
- `SecretManager`: A string constant representing the Secret Manager used in the application.
- `DatabaseCoreRo`: A string constant representing the read-only database connection details.
- `DatabaseCoreWr`: A string constant representing the write database connection details.
- `CacheRedis`: A string constant representing the Redis cache server address.
- `ExportQueue`: A string constant representing the export queue URL.
- `Region`: A string constant representing the AWS region.
- `Environment`: A string constant representing the environment setting.
- `DistributionDefaultDate`: A string constant representing the default distribution date.
- `S3Bucket`: A string constant representing the S3 bucket used for storage.
- `LimitGoRoutines`: An integer constant representing the limit of Goroutines.

### exportUtil.go

The `exportUtil.go` file contains a function `GetHeaders` that generates a map of headers based on the input columns. This function takes a slice of maps containing column information and returns a map with index as the key and column name as the value.

### httpUtil.go

The `httpUtil.go` file contains a struct `HttpClient` representing an HTTP client and a method `HttpRequest` for making HTTP requests. The `HttpClient` struct has a method `NewHttpClient` for creating a new instance of the HTTP client.

The `HttpRequest` method takes parameters for HTTP method, URI, query string, headers, and JSON byte array. It constructs an HTTP request based on the input parameters, sends the request, and returns the response body as a byte array if the status code is in the 2xx range. Otherwise, it returns an error with the response status code.

## Interactions

The `constants.go` file provides essential constants used throughout the application, such as database connection details, AWS resources, and environment settings. The `exportUtil.go` file offers a utility function for generating headers based on column information. The `httpUtil.go` file implements an HTTP client and a method for making HTTP requests, which can interact with external APIs or services.

## Design Patterns

The code in these files follows a structured approach, utilizing common design patterns such as the singleton pattern for the HTTP client instance and the utility function pattern for generating headers in the export utility. The HTTP client method also demonstrates error handling and HTTP request/response processing patterns to ensure reliable communication with external resources.
---


## Files Documentation: common/interfaces.go

### Components:
- **IHttpClient interface:**
  - Description: Defines the methods that a HttpClient should implement.
  - Methods:
    - HttpRequest(method string, uri string, queryString string, headers map[string]string, jsonByteArr []byte) ([]byte, error): Sends an HTTP request with the provided method, uri, queryString, headers, and JSON byte array payload.

### Interactions:
- The IHttpClient interface provides a blueprint for implementing HTTP client functionality within the repository. Other packages and components can utilize this interface to make HTTP requests.

### Design Patterns:
- This file demonstrates the extensive use of interfaces to define contracts for HttpClient implementations. This allows for flexibility in swapping out different HTTP client implementations without changing the overall structure of the codebase.

---

## Files Documentation: common/json/jsonArrayProperty.go

### Components:
- **JsonArrayProperty type:**
  - Description: Represents an array of generic JSON properties.
  - Methods:
    - Value() (driver.Value, error): Returns the driver.Value representation of the JsonArrayProperty.
    - Scan(src interface{}) error: Converts the source interface to a JsonArrayProperty.

### Interactions:
- JsonArrayProperty is used to handle and convert JSON array properties in database interactions. It provides methods to convert the data into a format suitable for database storage and retrieval.

### Design Patterns:
- This file showcases the implementation of the Value and Scan methods required for database/sql/driver compatibility. The use of Value and Scan methods adheres to the database/sql/driver interface design pattern for custom data types.

---

## Files Documentation: common/json/jsonProperty.go

### Components:
- **JsonProperty type:**
  - Description: Represents a map of key-value pairs for JSON properties.
  - Methods:
    - Value() (driver.Value, error): Returns the driver.Value representation of the JsonProperty.
    - Scan(src interface{}) error: Converts the source interface to a JsonProperty.

### Interactions:
- JsonProperty is used to handle and convert JSON properties stored as key-value pairs in database interactions. It provides methods to convert the data into a format suitable for database storage and retrieval.

### Design Patterns:
- Similar to JsonArrayProperty, this file also implements the Value and Scan methods for database/sql/driver compatibility. This design adheres to the database/sql/driver interface pattern for custom data types, ensuring interoperability with database operations.
---

## Common Mail Package

### File: mail.go

The `mail.go` file in the `common/mail` package contains the `Mailer` struct and associated methods for handling email functionalities such as sending password reset emails and access requested emails.

#### Components:
1. `Mailer` struct: Represents an email sender with fields for the sender's contact information, email endpoint, mailer interface, application URL, environment configuration, and logger.

2. `New` function: Creates a new instance of the `Mailer` struct with the provided parameters.

3. `GetFromContact` method: Returns the sender's contact information.

4. `PasswordReset` method: Sends a password reset email to the specified email address with the username and language.

5. `AccessRequested` method: Sends an access requested email with the specified details such as email, username, requesting email, requesting name, organization name, organization logo, and language.

### File: s3tpl.go

The `s3tpl.go` file in the `common/mail` package contains a function `s3tpl` for fetching email templates from a given URL and caching them for future use.

#### Components:
1. `cache` variable: Maps template names to their respective template contents for caching.

2. `s3tpl` function: Retrieves an email template from the provided URL, caches it, and returns the template content.

### Interactions:
- The `Mailer` struct in `mail.go` interacts with the `mailer.MailerInterface` for sending emails and with the `config.EnvConfig` for environmental configuration.
- The `s3tpl` function in `s3tpl.go` interacts with external HTTP resources to retrieve email templates.

### Design Patterns:
- Factory Method: The `New` function in `mail.go` follows the factory method pattern to create instances of the `Mailer` struct.
- Caching: The `s3tpl` function in `s3tpl.go` implements a caching mechanism to store and reuse previously fetched email templates.

```go
// Example usage of the Mailer struct
mailer := New(envConfig, logger, "Sender Name", "sender@example.com", "email_endpoint", mockMailer, "appUrl")
err := mailer.PasswordReset("recipient@example.com", "Recipient Name", "en")
if err != nil {
    log.Println("Error sending password reset email:", err)
}
```
---

## Mail Template Components

### File: common/mail/template.go

This file contains various struct definitions for different email templates used in the application. Each struct includes fields for the sender email address, email subject, and email body in YAML format.

### Design Patterns Used

- **Structs**: Utilized to encapsulate the data for each email template and maintain consistency across different types of emails.

---

## Mailer Components

### File: common/mailer/interfaces.go

This file defines the `MailerInterface` interface, which includes methods for sending emails to single recipients and multiple recipients. The methods accept parameters such as sender, recipient(s), reply-to, subject, email body, and custom arguments.

### File: common/mailer/dto/contact.go

This file defines the `Contact` struct, which includes fields for the name and email address of a contact.

### Design Patterns Used

- **Interface**: Used to define a contract for sending emails, allowing for multiple implementations.
- **Struct**: Utilized to represent contact information for email recipients.
- **Dependency Injection**: Parameters are passed into the methods to enable flexibility and modularity when sending emails.

---
---

## Mailer Component

The Mailer component in this section consists of two files: `MailerInterface.go` and `email.go`. 

### MailerInterface.go
- This file contains an autogenerated mock type for the `MailerInterface` type.
- It provides mock functions for sending emails to single recipients and multiple recipients.
- The `SendEmail` function sends an email to a single recipient with specified parameters such as `from`, `to`, `replyTo`, `subject`, `body`, and `customArgs`.
- The `SendEmailToMultipleRecipients` function sends an email to multiple recipients with additional parameters like `substitutions`, `customArgs`, and `generalCustomArgs`.
- It also includes a function `NewMailerInterface` for creating a new instance of the `MailerInterface`.

### email.go
- This file implements the `SendGrid` struct which interacts with the SendGrid API to send emails.
- The `New` function creates a new instance of the `SendGrid` struct with necessary configuration parameters.
- The `SendEmail` method sends an email using the SendGrid API with the provided email content and custom arguments.
- It handles features like sending copies to additional recipients, setting reply-to address, and adding custom arguments to the email.

### Interactions
- The `MailerInterface` mock serves as a simulation for the actual Mailer component, allowing for testing email sending functionalities without actually sending emails.
- The `SendGrid` struct interacts with the SendGrid API to process and send emails based on the parameters provided.

### Design Patterns
- The Adapter Pattern is used in the `MailerInterface` mock to simulate the behavior of the `MailerInterface` type for testing purposes.
- The Strategy Pattern is utilized in the `SendGrid` struct to encapsulate the email sending logic and provide flexibility in adding custom email features.

```go
// Example usage of MailerInterface mock
fromContact := dto.Contact{Name: "Sender", Email: "sender@example.com"}
toContact := dto.Contact{Name: "Recipient", Email: "recipient@example.com"}
mockMailer := Mocks.MailerInterface{}
mockMailer.On("SendEmail", fromContact, toContact, dto.Contact{}, "Test Subject", "Test Body", map[string]string{}).Return(nil)

// Example usage of SendGrid struct
sendGrid := sendgrid.New(envConfig, "API_KEY", "api.sendgrid.com", "/v3/mail/send", logger)
err := sendGrid.SendEmail(fromContact, toContact, dto.Contact{}, "Test Subject", "Test Body", map[string]string{"customArg": "value"})
```
---

## Email Service Component

The `email.go` file in the `sqsMailer` package contains the implementation for sending emails via AWS SQS (Simple Queue Service). Let's break down the components and their interactions:

### Components:
1. `SqsMailer`: This struct represents the email service and contains the necessary fields like the SQS queue, queue URL, and environment configuration.
2. `mailerMessage`: This struct defines the structure of an email message with fields like `From`, `To`, `Subject`, `Body`, etc.
3. `New(env *config.EnvConfig, queue *sqs.SQS, queueURL string) *SqsMailer`: This function creates a new instance of `SqsMailer`.
4. `SendEmail(from, to, replyTo dto.Contact, subject, body string, customArgs map[string]string) error`: This method sends an email to a single recipient.
5. `SendEmailToMultipleRecipients(from dto.Contact, tos []dto.Contact, replyTo dto.Contact, subject, body string, substitutions []map[string]string, customArgs []map[string]string, generalCustomArgs map[string]string) error`: This method sends an email to multiple recipients with support for custom arguments and substitutions.

### Interactions:
- The `SendEmail` method calls the `SendEmailToMultipleRecipients` method internally to handle multiple recipients efficiently.
- The `mailerMessage` struct is used to structure the email message content before sending it via SQS.

### Design Patterns:
- Builder Pattern: The `New` function follows a builder pattern to create instances of the `SqsMailer` struct with required configurations.
- Singleton Pattern: The `SqsMailer` struct could be considered a singleton as it holds a specific SQS queue and configuration for email sending.

## HTTP Client Mock Component

The `IHttpClient.go` file in the `mocks` package provides a mock implementation for an HTTP client. Let's understand its structure and purpose:

### Components:
1. `IHttpClient`: This struct mocks the functionality of an HTTP client with a `HttpRequest` method.
2. `HttpRequest`: This method mocks the behavior of making HTTP requests with parameters like method, URI, headers, etc.

### Interactions:
- This mock allows for testing components that depend on HTTP client interactions without making actual network requests.

### Design Patterns:
- Mocking Pattern: The file follows a common pattern for creating mock implementations of external dependencies for unit testing.

## Logger Interface Mock Component

The `LoggerInterface.go` file in the `mocks` package provides a mock implementation for a logger interface. Let's explore its structure and usage:

### Components:
1. `LoggerInterface`: This struct serves as a mock implementation of a logging interface with methods like `Debug`, `Error`, `Info`, etc.

### Interactions:
- The mock `LoggerInterface` can be used in unit tests to verify that log messages are being sent correctly without actually writing to logs.

### Design Patterns:
- Mocking Pattern: The file demonstrates a common practice of mocking external dependencies like loggers for testing purposes.

These files collectively contribute towards building a robust and testable email sending service with logging and HTTP client mock capabilities.
---

## Files Documentation

### common/replaceMessageString.go

The `replaceMessageString.go` file contains a function named `ReplaceMessageString` in the `common` package. This function replaces message strings by dynamically replacing placeholders with actual values. The function takes in parameters such as layout, default language, customer name, interaction metadata, customer metadata, organization name, and questions count. It then populates the necessary data structures and uses the `replacer` package to perform the replacement, returning the updated layout.

### common/sqs/queue.go

The `queue.go` file in the `common/sqs` package is used to handle Amazon Simple Queue Service (SQS) operations. It contains functions to initialize and retrieve an SQS queue based on the environment configuration. The `GetSqsQueue` function checks if an SQS queue instance already exists and returns it if so, otherwise it initializes a new queue using the `initSqsQueue` function. The `initSqsQueue` function creates a new session based on the environment configuration and returns an SQS client.

### common/stringUtil.go

The `stringUtil.go` file in the `common` package provides utility functions related to strings. It includes functions like `ToCamelCase` for converting strings to camel case, `IsGUID` for validating if a string is in GUID format, and `StringToBool` for converting a string to a boolean value based on the content.

### Interactions

1. The `ReplaceMessageString` function in `common/replaceMessageString.go` interacts with the `replacer` package to perform message string replacements using customer and interaction metadata.
2. The `GetSqsQueue` function in `common/sqs/queue.go` interacts with the AWS SDK to initialize and retrieve an SQS queue based on the environment configuration.

### Design Patterns

- The `ReplaceMessageString` function in `common/replaceMessageString.go` follows the Strategy design pattern by delegating the message string replacement logic to the `replacer` package.
- The `initSqsQueue` function in `common/sqs/queue.go` demonstrates the Factory Method design pattern by providing a method to create instances of an SQS queue based on the environment configuration.
---

## Common Package

### Components
1. **timeUtil.go**
   - Contains functions for handling time-related operations.
   - `GetDateUTCByLocale(timestamp int64, loc *time.Location) string`: Returns a formatted UTC date based on the specified timestamp and location.
   - `GetLocationByTimeOffSet(timeOffset float32) string`: Returns the timezone location based on the provided time offset.

2. **translateEmailTemplate/translateEmailTemplate.go**
   - Provides functionality for translating email templates.
   - Defines types for language translation and email template data.
   - `CastLanguageToTranslateLanguage(language string) TranslateLanguage`: Converts a string language to the corresponding TranslateLanguage enum.
   - `TranslateEmailTemplate(mailData []MailDTO, templateLocation string, lang TranslateLanguage) (emailBody string, TranslatedItens map[string]interface{})`: Loads email template and translates it based on the specified language.

3. **typingUtil.go**
   - Contains functions for type conversions.
   - `ConvertMapToStringSliceByKeys(m map[string]string, keys []string) []string`: Converts a map to a string slice based on the provided keys.

### Interactions
- **timeUtil.go** and **translateEmailTemplate/translateEmailTemplate.go** interact by providing date/time manipulation and translation features for email templates.
- **translateEmailTemplate/translateEmailTemplate.go** uses the functions from **common/timeUtil.go** to handle date formatting and location adjustments for translations.
- **translateEmailTemplate/translateEmailTemplate.go** may utilize functions from **common/typingUtil.go** for type conversions when translating email template data.

### Design Patterns
- **Strategy Pattern**: The design involves different strategies for language translation (TranslateLanguage) and handling time-related operations (time functions).
- **Factory Method Pattern**: The `CastLanguageToTranslateLanguage` function acts as a factory method to create instances of TranslateLanguage based on input language strings.
- **Template Method Pattern**: The `TranslateEmailTemplate` function defines a template for translating email templates, allowing for customization of the translation process.

```go
// Example usage of CastLanguageToTranslateLanguage
translateLanguage := CastLanguageToTranslateLanguage("en_US")

// Example usage of TranslateEmailTemplate
emailBody, TranslatedItens := TranslateEmailTemplate(mailData, templateLocation, translateLanguage)
```
---

## Uploader Component

The `Uploader` component in the `s3upload/upload.go` file is responsible for handling the uploading of files to AWS S3. It contains the following methods:

- `UploadFileData`: This method uploads a file to S3 after checking if the file extension is allowed. It generates a unique filename based on the content of the file.

- `checkType`: This method checks if the file extension is allowed based on a list of allowed types.

- `save`: This method saves the file to S3 either as a CSV file or a regular file based on the file extension.

- `md5Name`: This method generates an MD5 hash based on the content of the file.

The `Uploader` component interacts with the `aws.AWSS3Interface` interface from the `github.com/Tracksale/cxm-core/pkg/aws/s3` package to interact with AWS S3 for file uploads.

The design pattern used in this component is the Strategy Pattern, where different strategies are used based on the file extension to determine how to upload the file to S3.

## UploaderInterface Mock

The `UploaderInterface` mock in the `common/upload/mocks/UploaderInterface.go` file is an autogenerated mock type for the `UploaderInterface` interface. It is generated by the `mockery` library for testing purposes.

The mock provides a mock implementation of the `UploadFileData` method and allows specifying return values for testing different scenarios.

The `NewUploaderInterface` function creates a new instance of the `UploaderInterface` mock and sets up the testing environment by registering a testing interface and a cleanup function to assert mock expectations.

Overall, the Uploader and UploaderInterface components work together to facilitate file uploads to AWS S3 with proper validation and handling based on file types and content.
---

## Configuration and Mailer Components

### `const.go`
The `const.go` file defines a constant `ServiceName` with the value "cxm-export". This constant is used to identify the service within the codebase.

### `env.go`
The `env.go` file contains the `EnvConfig` struct, which represents the environment configuration for the service. It includes various environment variables such as database connection strings, AWS configuration, email settings, Redis address, health check port, worker time, and more. These variables are loaded from the environment using the `env` tags and can be accessed throughout the service.

### `mailer.go`
The `mailer.go` file includes the logic for initializing and retrieving a mailer instance based on the environment configuration. The `initMailer` function initializes a mailer object either using SendGrid setup for development environment or a SQS mailer for other environments. The `GetMailer` function acts as a singleton to return the initialized mailer instance.

### Interactions
1. The `EnvConfig` struct in `env.go` is used to hold all the environment variables required for the service to function.
2. The `mailerInstance` variable in `mailer.go` is used to store the initialized mailer instance to ensure only one instance is created.
3. The `initMailer` function in `mailer.go` initializes the mailer instance based on the environment configuration and logger provided.
4. The `GetMailer` function in `mailer.go` is used to retrieve the initialized mailer instance. If it already exists, it returns the stored instance; otherwise, it initializes a new one.

### Design Patterns
The code in these files demonstrates the use of the Singleton design pattern to ensure that only one instance of the mailer is created and shared within the service. By using a global variable `mailerInstance` and the `GetMailer` function to control access to the instance, the code promotes reusability and maintainability of the mailer functionality.
---

## `exporterUseCase.unit_test.go`

### Components:
- `blockruleMock`: Mock implementation for block rule functionality.
- `custRepositoryMocks`: Mock implementation for customer repository.
- `distributionMock`: Mock implementation for distribution functionality.
- `distRepositoryMock`: Mock implementation for distribution repository.
- `export`: Package containing export functionality.
- `mocks`: Mock implementations for various components.
- `exportRepositoryMock`: Mock implementation for export repository.
- `interRepositoryMock`: Mock implementation for interaction repository.
- `loopRepositoryMock`: Mock implementation for loop repository.
- `metadataDomain`: Domain entities related to metadata.
- `metadataRepositoryMock`: Mock implementation for metadata repository.
- `orgDomain`: Domain entities related to organization.
- `orgRepositoryMocks`: Mock implementation for organization repository.
- `segmentMock`: Mock implementation for segment functionality.
- `sentimentAnalysisMock`: Mock implementation for sentiment analysis functionality.
- `surveyRepositoryMock`: Mock implementation for survey repository.
- `teamDomain`: Domain entities related to team.
- `teamMock`: Mock implementation for team functionality.
- `userDomain`: Domain entities related to user.
- `userRepositoryMocks`: Mock implementation for user repository.
- `mail`: Package for sending emails.
- `mailMocks`: Mock implementation for email functionality.
- `commonMocks`: Common mock implementations.
- `uploadMocks`: Mock implementation for file uploading functionality.

### Interactions:
- The unit tests in this file are testing the functionality of the export use case.
- Various mock implementations are used to simulate interactions with different components such as databases, APIs, and external services.
- The tests verify the behavior of the export use case under different scenarios and ensure that it handles errors appropriately.

### Design Patterns Used:
- Mocking: The use of mock implementations allows for isolated testing of specific components without relying on the actual implementations. This helps in thorough testing and identifying issues early in the development cycle.
- Dependency Injection: The use of mock implementations and interfaces in the tests allows for easy swapping of dependencies, enabling better testability and flexibility in the codebase.