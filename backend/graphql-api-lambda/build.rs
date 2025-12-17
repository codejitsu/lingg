fn main() {
    // rerun this build script if schema.graphql changes
    println!("cargo:rerun-if-changed=../schema.graphql");
}
