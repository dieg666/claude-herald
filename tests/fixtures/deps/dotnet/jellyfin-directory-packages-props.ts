/**
 * jellyfin/jellyfin Directory.Packages.props, trimmed to the packages the tests read.
 */
export const JELLYFIN_DIRECTORY_PACKAGES_PROPS = `<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <!-- Run "dotnet list package (dash,dash)outdated" to see the latest versions of each package.-->
  <ItemGroup Label="Package Dependencies">
    <PackageVersion Include="AsyncKeyedLock" Version="8.0.2" />
    <PackageVersion Include="CommandLineParser" Version="2.9.1" />
    <PackageVersion Include="IDisposableAnalyzers" Version="4.0.8" />
    <PackageVersion Include="Morestachio" Version="5.0.1.670" />
    <PackageVersion Include="prometheus-net" Version="8.2.1" />
    <PackageVersion Include="Serilog.AspNetCore" Version="10.0.0" />
    <PackageVersion Include="SerilogAnalyzer" Version="0.15.0" />
    <PackageVersion Include="StyleCop.Analyzers" Version="1.2.0-beta.556" />
  </ItemGroup>
</Project>
`
