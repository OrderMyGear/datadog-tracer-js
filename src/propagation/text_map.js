'use strict'

const Long = require('long')
const DatadogSpanContext = require('../span_context')

class TextMapPropagator {
  inject (spanContext, carrier) {
    Object.assign(carrier, {
      'x-datadog-trace-id': spanContext.traceId.toString(),
      'x-datadog-parent-id': spanContext.spanId.toString(),
      'dd-tracer-sampled': String(spanContext.sampled)
    })

    spanContext.baggageItems && Object.keys(spanContext.baggageItems).forEach(key => {
      carrier[`dd-baggage-${key}`] = JSON.stringify(spanContext.baggageItems[key])
    })
  }

  extract (carrier) {
    const baggageItems = {}

    try {
      Object.keys(carrier).forEach(key => {
        const match = key.match(/^dd-baggage-(.+)$/)

        if (match) {
          baggageItems[match[1]] = JSON.parse(carrier[key])
        }
      })

      return new DatadogSpanContext({
        traceId: Long.fromString(carrier['x-datadog-trace-id'], true),
        spanId: Long.fromString(carrier['x-datadog-parent-id'], true),
        sampled: JSON.parse(carrier['dd-tracer-sampled']),
        baggageItems
      })
    } catch (e) {
      return null
    }
  }
}

module.exports = TextMapPropagator
