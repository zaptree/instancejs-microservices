# microservices

## introduction

## Folder structure and files involved

## Quick Example of API and service

## Messengers and Messages configuration
TODO list:

- config: types
- config: incoming 
- config: outgoing
- Http messenger
- RabbitMQ messenger
- Rpc messenger
- creating custom messengers/extending existing ones


## Schemas
TODO list:

- type checking
- loose vs strict vs filter
- validation

## Components
TODO list:

- how to add components to your modules
- adding decorators to your modules using components
- example auth component using decorators

## Testing

### gulp-istanbul fix

### sinon integration

Note that there is a known limitation to stubbing and spying: If the class method being stubbed has already been injected before the stub was created, the method will not be stubbed. This is because the stub get's created during creation of the instance.


## Dependency Injection
A lot of this stuff might be better to put directly in the di module and leave here only docs specific to framework

- explain types, factories
- explain creating manually and autoLoading
- explain async resolution
- explain scope vs setScope (mention setScope should almost always be /service/ except for values)
- explain singleton true/false

### Built in factories

- creating a custom factory
- CoreValueFactory
- CoreValueFactory

### Built in types for modules

#### types that use the CoreValueFactory factory:

- globalValue: this is a singleton on the root scope. i.e. it will be shared among all services and will persist
```
    {
        singleton: true,
        setScope: '/',
        scope: '/',
        factory: 'CoreValueFactory'
    }
```

- serviceValue: this is a singleton on the service scope. i.e. once created it will persist anytime it is used within the service it was created.
```
    {
        singleton: true,
        setScope: '/service/',
        scope: '/service/',
        factory: 'CoreValueFactory'
    }        
```

- value: this is a singleton stored in whatever scope it was created. i.e. if it was created in the controller it will only exist for the current request
```
    {
        singleton: true,
        factory: 'CoreValueFactory'
    }
```

#### types that use the CoreDefaultFactory factory:

- controller, requestSingleton, messageSingleton: these types are identical and are singletons for the request scope. i.e. they are created once during a current request and when the request is over they are disposed of.
```
    {
        singleton: true,
        setScope: '/service/',
        scope: '/service/request/',
        factory: 'CoreDefaultFactory'
    }
```

- messenger, singleton, default, create: these types are identical and are singletons on the service level. i.e. i.e. once created it will persist anytime it is used within the service it was created.
```
    {
        singleton: true,
        scope: '/service/',
        factory: 'CoreDefaultFactory'
    }
```

- instance, new: these types are not singletons and thus scope is irrelevant since the instance is not saved but discarded after use.
```
    {
        singleton: false,
        setScope: '/service/',
        factory: 'CoreDefaultFactory'
    }
```

- global: this is a singleton stored in the root thus a single instance will be shared among all services. This is usually a bad choice unless you know for sure that all services in the same process will want the exact same implementation. A possible use for this is a module that establishes database connection pools that can be shared among services. Probably best to not use this since when deploying microservices in production each service will run in isolation so singleton that uses the service scope would work just the same.
```
    {
        singleton: true,
        scope: '/',
        factory: 'CoreDefaultFactory'
    }
```

#### more obscure used types

- scopedSingleton: a singleton that will be on whatever scope it is created in. i.e. if created in the controller it will be in the request scope. This is a more obscure type with little practical use. 
```
    {
        singleton: true,
        setScope: '/service/',
        // no scope we let that be whatever injector it was created in
        factory: 'CoreDefaultFactory'
    }
```

- static: this type passes the option static: true to the CoreDefaultFactory and the factory does not instantiate the function but just calls it passing in the dependencies. This is not a singleton.
```
    {
        static: true,
        singleton: false,
        setScope: '/service/',
        factory: 'CoreDefaultFactory'
    }
```

- staticSingleton: same as static but is a singleton on the service scope
```
    {
        static: true,
        singleton: false,
        setScope: '/service/',
        scope: '/service/',
        factory: 'CoreDefaultFactory',
    }
```



### default type matching for modules

todo




