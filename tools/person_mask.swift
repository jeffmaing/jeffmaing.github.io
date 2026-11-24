// Person matte via the macOS Vision framework (on-device instance segmentation).
// usage: swift person_mask.swift <input.png> <mask.png>
// Writes a greyscale PNG: 255 where the person is, 0 for the background.
import AppKit
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("usage: person_mask <in> <out>\n".data(using: .utf8)!)
    exit(2)
}
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])

guard let input = CIImage(contentsOf: inURL) else {
    FileHandle.standardError.write("cannot read \(inURL.path)\n".data(using: .utf8)!)
    exit(1)
}

let request = VNGeneratePersonSegmentationRequest()
request.qualityLevel = .accurate
request.outputPixelFormat = kCVPixelFormatType_OneComponent8

let handler = VNImageRequestHandler(ciImage: input, options: [:])
do {
    try handler.perform([request])
} catch {
    FileHandle.standardError.write("vision failed: \(error)\n".data(using: .utf8)!)
    exit(1)
}
guard let observation = request.results?.first else {
    FileHandle.standardError.write("no person found\n".data(using: .utf8)!)
    exit(1)
}

let mask = CIImage(cvPixelBuffer: observation.pixelBuffer)
let context = CIContext(options: [.useSoftwareRenderer: true])
guard let cg = context.createCGImage(mask, from: mask.extent),
      let data = NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:]) else {
    FileHandle.standardError.write("could not encode mask\n".data(using: .utf8)!)
    exit(1)
}
try data.write(to: outURL)
print("mask \(Int(mask.extent.width))x\(Int(mask.extent.height)) confidence \(observation.confidence) -> \(outURL.path)")
